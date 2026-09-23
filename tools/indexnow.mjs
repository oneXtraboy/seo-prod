#!/usr/bin/env node
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = 'synapsee.ru'
const ORIGIN = `https://${HOST}`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = path.join(ROOT, 'prototype', 'public')
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/
const TECHNICAL_PATH = /^\/(?:_|admin(?:\/|$)|api(?:\/|$)|preview(?:\/|$)|search(?:\/|$))/

function option(args, name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function options(args, name) {
  const values = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) values.push(args[index + 1])
  }
  return values
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))
  return match?.[2]
}

function canonicalFromHtml(html) {
  const links = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of links) {
    const rel = attribute(tag, 'rel')?.toLowerCase().split(/\s+/) ?? []
    if (rel.includes('canonical')) return attribute(tag, 'href')
  }
}

function isNoIndex(html) {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? []
  return metas.some((tag) => {
    const name = attribute(tag, 'name')?.toLowerCase()
    const content = attribute(tag, 'content')?.toLowerCase().split(/[\s,]+/) ?? []
    return name === 'robots' && content.includes('noindex')
  })
}

function eligibleUrl(value) {
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== HOST ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      TECHNICAL_PATH.test(url.pathname)
    ) return undefined
    return url.href
  } catch {
    return undefined
  }
}

function normalizedHtml(html) {
  return html
    .replace(/<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']*\/assets\/[^"']+["'])[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'][^"']*\/assets\/[^"']+["'])[^>]*>/gi, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

async function indexFiles(directory) {
  const found = []
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await walk(target)
      else if (entry.isFile() && entry.name === 'index.html') found.push(target)
    }
  }
  await walk(directory)
  return found
}

async function pageManifest(directory) {
  const pages = new Map()
  for (const file of await indexFiles(directory)) {
    const html = await fs.readFile(file, 'utf8')
    if (isNoIndex(html)) continue

    const canonical = eligibleUrl(canonicalFromHtml(html))
    if (!canonical) continue

    const relative = path.relative(directory, file).split(path.sep).join('/')
    const expectedPath = relative === 'index.html' ? '/' : `/${relative.slice(0, -'index.html'.length)}`
    if (new URL(canonical).pathname !== expectedPath) continue

    pages.set(canonical, createHash('sha256').update(normalizedHtml(html)).digest('hex'))
  }
  return pages
}

export function filterUrls(values) {
  return [...new Set(values.map(eligibleUrl).filter(Boolean))].sort()
}

export async function changedUrls(beforeDirectory, afterDirectory) {
  const [before, after] = await Promise.all([
    pageManifest(path.resolve(beforeDirectory)),
    pageManifest(path.resolve(afterDirectory)),
  ])
  const urls = new Set()
  for (const [url, hash] of before) {
    if (!after.has(url) || after.get(url) !== hash) urls.add(url)
  }
  for (const [url, hash] of after) {
    if (!before.has(url) || before.get(url) !== hash) urls.add(url)
  }
  return [...urls].sort()
}

async function loadKey() {
  const candidates = []
  for (const name of await fs.readdir(PUBLIC_DIR)) {
    if (!name.endsWith('.txt')) continue
    const key = (await fs.readFile(path.join(PUBLIC_DIR, name), 'utf8')).trim()
    if (KEY_PATTERN.test(key) && name === `${key}.txt`) candidates.push({ key, file: path.join(PUBLIC_DIR, name) })
  }
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one IndexNow key file in ${PUBLIC_DIR}; found ${candidates.length}`)
  }
  return candidates[0]
}

function statusMessage(status) {
  return {
    400: 'invalid request',
    403: 'key or keyLocation was rejected',
    422: 'URL does not belong to the host or is invalid',
    429: 'too many requests',
  }[status] ?? `unexpected HTTP ${status}`
}

export async function submitUrls(values, fetchImpl = fetch) {
  const urlList = filterUrls(values)
  if (urlList.length === 0) {
    console.log('[IndexNow] No changed indexable URLs; request skipped.')
    return { skipped: true, urlList }
  }

  const { key } = await loadKey()
  const keyLocation = `${ORIGIN}/${key}.txt`
  const response = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(20_000),
  })
  if (response.status !== 200 && response.status !== 202) {
    const detail = (await response.text()).trim()
    throw new Error(`IndexNow ${statusMessage(response.status)}${detail ? `: ${detail}` : ''}`)
  }

  console.log(`[IndexNow] Accepted ${urlList.length} URL(s), HTTP ${response.status}.`)
  return { skipped: false, status: response.status, urlList }
}

async function verifyKey(fetchImpl = fetch) {
  const { key } = await loadKey()
  const keyLocation = `${ORIGIN}/${key}.txt`
  const response = await fetchImpl(keyLocation, { redirect: 'manual', signal: AbortSignal.timeout(20_000) })
  if (response.status !== 200) throw new Error(`IndexNow key file returned HTTP ${response.status}`)
  if ((await response.text()) !== key) throw new Error('IndexNow key file content does not exactly match its file name')
  console.log(`[IndexNow] Key file verified: ${keyLocation}`)
}

async function main() {
  const [command, ...args] = process.argv.slice(2)

  if (command === 'diff') {
    const before = option(args, '--before')
    const after = option(args, '--after')
    const output = option(args, '--output')
    if (!before || !after || !output) throw new Error('Usage: indexnow.mjs diff --before DIR --after DIR --output FILE')
    const urls = await changedUrls(before, after)
    await fs.writeFile(output, urls.length ? `${urls.join('\n')}\n` : '', 'utf8')
    console.log(`[IndexNow] Changed indexable URLs: ${urls.length}`)
    for (const url of urls) console.log(`  ${url}`)
    return
  }

  if (command === 'verify-key') {
    await verifyKey()
    return
  }

  if (command === 'submit') {
    const file = option(args, '--urls-file')
    const values = options(args, '--url')
    if (file) values.push(...(await fs.readFile(file, 'utf8')).split(/\r?\n/))
    await submitUrls(values)
    return
  }

  throw new Error('Usage: indexnow.mjs <diff|verify-key|submit> [options]')
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[IndexNow] ${error.message}`)
    process.exitCode = 1
  })
}
