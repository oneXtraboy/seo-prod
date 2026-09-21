#!/usr/bin/env node

import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'

const READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const PROPERTY = 'sc-domain:synapsee.ru'
const INSPECTION_URL = 'https://synapsee.ru/'
const COMMANDS = new Set([
  'overview',
  'queries',
  'pages',
  'query-pages',
  'countries',
  'devices',
  'search-appearance',
  'opportunities',
  'seo',
])
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialsPath = path.join(projectRoot, 'secrets', 'gsc-oauth-client.json')
const tokenPath = path.join(projectRoot, '.gsc-token.json')
const outputDirectory = path.join(projectRoot, 'reports', 'gsc')
const MIN_ROW_IMPRESSIONS = 10
const MIN_ANALYSIS_IMPRESSIONS = 100
const MIN_ANALYSIS_ROWS = 5

function usage() {
  return `Usage:
  node tools/gsc.mjs <command> [--date1 YYYY-MM-DD] [--date2 YYYY-MM-DD] [--limit N]

Commands:
  overview
  queries
  pages
  query-pages
  countries
  devices
  search-appearance
  opportunities
  seo

Defaults:
  The latest 28 finalized days available in Google Search Console
  limit=1000 (maximum 25000)

Authentication:
  Uses only ${READONLY_SCOPE}
  OAuth client: secrets/gsc-oauth-client.json
  Local token: .gsc-token.json`
}

function parseArguments(argv) {
  const [command, ...args] = argv
  if (!command || command === '--help' || command === '-h') return { help: true }
  if (!COMMANDS.has(command)) throw new Error(`Unknown command: ${command}\n\n${usage()}`)

  let date1
  let date2
  let limit = 1000
  for (let index = 0; index < args.length;) {
    const argument = args[index]
    const [name, inlineValue] = argument.split('=', 2)
    if (!['--date1', '--date2', '--limit'].includes(name)) throw new Error(`Unknown option: ${argument}`)
    const value = inlineValue ?? args[index + 1]
    if (!value) throw new Error(`Missing value for ${name}`)
    if (name === '--date1') date1 = value
    if (name === '--date2') date2 = value
    if (name === '--limit') limit = Number(value)
    index += inlineValue === undefined ? 2 : 1
  }

  if (date1) validateDate(date1, '--date1')
  if (date2) validateDate(date2, '--date2')
  if (!Number.isInteger(limit) || limit < 1 || limit > 25000) {
    throw new Error('--limit must be an integer from 1 to 25000')
  }
  return { command, date1, date2, limit, help: false }
}

function validateDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${name} must be a valid YYYY-MM-DD date`)
  }
}

function toDate(value) {
  return new Date(`${value}T00:00:00Z`)
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function shiftDate(value, days) {
  const date = toDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return formatDate(date)
}

function inclusiveDays(date1, date2) {
  return Math.round((toDate(date2) - toDate(date1)) / 86400000) + 1
}

async function loadSavedCredentials() {
  try {
    const content = JSON.parse(await readFile(tokenPath, 'utf8'))
    const client = google.auth.fromJSON(content)
    client.transporter.defaults = {
      timeout: 20000,
      retryConfig: { retry: 0 },
    }
    return client
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw new Error('The local GSC OAuth token is unreadable. Remove .gsc-token.json and authorize again.')
  }
}

async function saveCredentials(client) {
  const keys = JSON.parse(await readFile(credentialsPath, 'utf8'))
  const key = keys.installed || keys.web
  if (!key?.client_id || !key?.client_secret || !client.credentials.refresh_token) {
    throw new Error('Google OAuth did not return a refresh token. Revoke the app grant and authorize again.')
  }
  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  }
  await writeFile(tokenPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 })
  await chmod(tokenPath, 0o600)
}

async function authorize() {
  const saved = await loadSavedCredentials()
  if (saved) return saved

  const client = await authenticate({
    scopes: [READONLY_SCOPE],
    keyfilePath: credentialsPath,
  })
  await saveCredentials(client)
  return loadSavedCredentials()
}

function createClients(auth) {
  google.options({ timeout: 15000 })
  return {
    webmasters: google.webmasters({ version: 'v3', auth }),
    searchconsole: google.searchconsole({ version: 'v1', auth }),
  }
}

function safeApiError(error) {
  const status = error?.response?.status || error?.code || 'unknown'
  const message = error?.response?.data?.error?.message || error?.message || 'Unknown Google API error'
  return { status, message: String(message).replace(/[?&](?:access_token|code)=[^&\s]+/gi, '') }
}

async function propertyAccess(webmasters) {
  const response = await webmasters.sites.list({}, {
    timeout: 20000,
    retryConfig: { retry: 0 },
    signal: AbortSignal.timeout(20000),
  })
  const properties = (response.data.siteEntry ?? []).map((item) => ({
    site_url: item.siteUrl,
    permission_level: item.permissionLevel,
  }))
  const property = properties.find((item) => item.site_url === PROPERTY)
  if (!property) {
    throw new Error(`Required Search Console property is unavailable: ${PROPERTY}`)
  }
  return { property, properties }
}

async function searchAnalytics(webmasters, period, dimensions = [], limit = 1000) {
  const response = await webmasters.searchanalytics.query({
    siteUrl: PROPERTY,
    requestBody: {
      startDate: period.date1,
      endDate: period.date2,
      dimensions,
      type: 'web',
      dataState: 'final',
      rowLimit: Math.min(limit, 25000),
      startRow: 0,
    },
  }, {
    timeout: 20000,
    retryConfig: { retry: 0 },
    signal: AbortSignal.timeout(20000),
  })
  return response.data
}

function normalizedRows(response, dimensions) {
  return (response.rows ?? []).map((row) => {
    const normalized = {}
    dimensions.forEach((dimension, index) => {
      const name = dimension === 'searchAppearance' ? 'search_appearance' : dimension
      normalized[name] = row.keys?.[index] ?? ''
    })
    normalized.clicks = row.clicks ?? 0
    normalized.impressions = row.impressions ?? 0
    normalized.ctr = row.ctr ?? 0
    normalized.position = row.position ?? 0
    return normalized
  })
}

function totalsFrom(response) {
  const row = response.rows?.[0]
  return {
    clicks: row?.clicks ?? 0,
    impressions: row?.impressions ?? 0,
    ctr: row?.ctr ?? 0,
    position: row?.position ?? 0,
  }
}

async function discoverAvailability(webmasters) {
  const today = formatDate(new Date())
  const response = await searchAnalytics(webmasters, {
    date1: shiftDate(today, -500),
    date2: today,
  }, ['date'], 25000)
  const dates = (response.rows ?? []).map((row) => row.keys?.[0]).filter(Boolean).sort()
  return {
    status: dates.length ? 'available' : 'no_data',
    first: dates[0] ?? null,
    last: dates.at(-1) ?? null,
    days_with_data: dates.length,
  }
}

function resolvePeriod(options, availability) {
  const fallbackDate2 = shiftDate(formatDate(new Date()), -3)
  const date2 = options.date2 ?? availability.last ?? fallbackDate2
  const date1 = options.date1 ?? shiftDate(date2, -27)
  if (date1 > date2) throw new Error('--date1 must not be later than --date2')
  const days = inclusiveDays(date1, date2)
  const previous = {
    date2: shiftDate(date1, -1),
    date1: shiftDate(date1, -days),
  }
  return { current: { date1, date2 }, previous }
}

async function diagnostics(clients, access) {
  const [sitemaps, inspection] = await Promise.all([
    clients.webmasters.sitemaps.list({ siteUrl: PROPERTY }, {
      timeout: 20000,
      retryConfig: { retry: 0 },
      signal: AbortSignal.timeout(20000),
    })
      .then((response) => ({
        status: 'available',
        count: response.data.sitemap?.length ?? 0,
        rows: (response.data.sitemap ?? []).map((item) => ({
          path: item.path,
          type: item.type,
          is_pending: item.isPending,
          is_sitemaps_index: item.isSitemapsIndex,
          last_submitted: item.lastSubmitted,
          last_downloaded: item.lastDownloaded,
          errors: item.errors,
          warnings: item.warnings,
        })),
      }))
      .catch((error) => ({ status: 'unavailable', error: safeApiError(error) })),
    clients.searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: INSPECTION_URL,
        siteUrl: PROPERTY,
        languageCode: 'ru-RU',
      },
    }, {
      timeout: 20000,
      retryConfig: { retry: 0 },
      signal: AbortSignal.timeout(20000),
    })
      .then((response) => {
        const result = response.data.inspectionResult?.indexStatusResult ?? {}
        return {
          status: 'available',
          inspected_url: INSPECTION_URL,
          verdict: result.verdict,
          coverage_state: result.coverageState,
          indexing_state: result.indexingState,
          robots_txt_state: result.robotsTxtState,
          page_fetch_state: result.pageFetchState,
          google_canonical: result.googleCanonical,
          user_canonical: result.userCanonical,
          last_crawl_time: result.lastCrawlTime,
        }
      })
      .catch((error) => ({ status: 'unavailable', error: safeApiError(error) })),
  ])

  return {
    available_properties_count: access.properties.length,
    available_properties: access.properties,
    sitemaps,
    url_inspection: inspection,
  }
}

function percentile(values, fraction) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * fraction)]
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0)
}

function section(rows, analyzedRows, criteria, sufficient) {
  const eligible = analyzedRows.filter((row) => row.impressions >= MIN_ROW_IMPRESSIONS)
  return {
    status: sufficient ? 'ok' : 'insufficient_data',
    criteria,
    sample: {
      rows_analyzed: analyzedRows.length,
      eligible_rows: eligible.length,
      clicks: sum(analyzedRows, 'clicks'),
      impressions: sum(analyzedRows, 'impressions'),
      minimum_row_impressions: MIN_ROW_IMPRESSIONS,
    },
    rows: sufficient ? rows : [],
  }
}

function opportunityAnalysis(current, previous) {
  const queries = current.queries
  const pages = current.pages
  const queryPages = current.queryPages
  const sufficientQueries = sum(queries, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS && queries.length >= MIN_ANALYSIS_ROWS
  const sufficientPages = sum(pages, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS && pages.length >= MIN_ANALYSIS_ROWS
  const eligibleQueries = queries.filter((row) => row.impressions >= MIN_ROW_IMPRESSIONS)
  const eligiblePages = pages.filter((row) => row.impressions >= MIN_ROW_IMPRESSIONS)
  const highQueryImpressions = Math.max(MIN_ROW_IMPRESSIONS, percentile(eligibleQueries.map((row) => row.impressions), 0.75))
  const highPageImpressions = Math.max(MIN_ROW_IMPRESSIONS, percentile(eligiblePages.map((row) => row.impressions), 0.75))
  const queryCtrReference = eligibleQueries.length ? sum(eligibleQueries, 'clicks') / sum(eligibleQueries, 'impressions') : 0
  const pageCtrReference = eligiblePages.length ? sum(eligiblePages, 'clicks') / sum(eligiblePages, 'impressions') : 0

  const previousPages = new Map(previous.pages.map((row) => [row.page, row]))
  const growingPages = eligiblePages.flatMap((row) => {
    const before = previousPages.get(row.page)
    if (!before || before.impressions < MIN_ROW_IMPRESSIONS) return []
    const impressionGrowth = (row.impressions - before.impressions) / before.impressions
    const clickGrowth = before.clicks > 0 ? (row.clicks - before.clicks) / before.clicks : null
    if (impressionGrowth <= 0 || (clickGrowth !== null && impressionGrowth <= clickGrowth + 0.1)) return []
    return [{
      ...row,
      previous_clicks: before.clicks,
      previous_impressions: before.impressions,
      impression_growth: impressionGrowth,
      click_growth: clickGrowth,
    }]
  }).sort((a, b) => b.impression_growth - a.impression_growth)

  const byQuery = new Map()
  for (const row of queryPages.filter((item) => item.impressions >= MIN_ROW_IMPRESSIONS)) {
    const rows = byQuery.get(row.query) ?? []
    rows.push(row)
    byQuery.set(row.query, rows)
  }
  const cannibalization = [...byQuery.entries()].flatMap(([query, rows]) => {
    const urls = [...new Set(rows.map((row) => row.page))]
    const impressions = sum(rows, 'impressions')
    if (urls.length < 2 || impressions < MIN_ANALYSIS_IMPRESSIONS) return []
    return [{
      query,
      url_count: urls.length,
      urls: urls.join(' | '),
      clicks: sum(rows, 'clicks'),
      impressions,
    }]
  }).sort((a, b) => b.impressions - a.impressions)

  return {
    positions_4_10: section(
      eligibleQueries.filter((row) => row.position >= 4 && row.position <= 10),
      queries,
      'position 4–10; at least 10 impressions per row',
      sufficientQueries,
    ),
    positions_11_20: section(
      eligibleQueries.filter((row) => row.position >= 11 && row.position <= 20),
      queries,
      'position 11–20; at least 10 impressions per row',
      sufficientQueries,
    ),
    high_impressions_low_ctr_queries: section(
      eligibleQueries.filter((row) => row.impressions >= highQueryImpressions && row.ctr < queryCtrReference),
      queries,
      `top-quartile impressions (>=${highQueryImpressions}) and CTR below sample CTR`,
      sufficientQueries,
    ),
    high_impressions_low_ctr_pages: section(
      eligiblePages.filter((row) => row.impressions >= highPageImpressions && row.ctr < pageCtrReference),
      pages,
      `top-quartile impressions (>=${highPageImpressions}) and CTR below sample CTR`,
      sufficientPages,
    ),
    impressions_growing_faster_than_clicks: section(
      growingPages,
      pages,
      'current vs previous equal period; impressions growth exceeds clicks growth by more than 10 percentage points',
      sufficientPages && sum(previous.pages, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS,
    ),
    zero_click_queries: section(
      eligibleQueries.filter((row) => row.clicks === 0),
      queries,
      'zero clicks; at least 10 impressions per row',
      sufficientQueries,
    ),
    potential_cannibalization: section(
      cannibalization,
      queryPages,
      'same query shown for at least 2 URLs; at least 100 combined impressions',
      queryPages.length >= MIN_ANALYSIS_ROWS && sum(queryPages, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS,
    ),
  }
}

async function analyticsBundle(webmasters, period, limit) {
  const overview = await searchAnalytics(webmasters, period, [], 1)
  const queries = await searchAnalytics(webmasters, period, ['query'], limit)
  const pages = await searchAnalytics(webmasters, period, ['page'], limit)
  const queryPages = await searchAnalytics(webmasters, period, ['query', 'page'], limit)
  return {
    overview: totalsFrom(overview),
    queries: normalizedRows(queries, ['query']),
    pages: normalizedRows(pages, ['page']),
    queryPages: normalizedRows(queryPages, ['query', 'page']),
  }
}

function comparison(current, previous) {
  const sufficient = current.impressions >= MIN_ANALYSIS_IMPRESSIONS && previous.impressions >= MIN_ANALYSIS_IMPRESSIONS
  const change = (value, before) => before ? (value - before) / before : null
  return {
    status: sufficient ? 'ok' : 'insufficient_data',
    sample: {
      current_impressions: current.impressions,
      previous_impressions: previous.impressions,
      minimum_period_impressions: MIN_ANALYSIS_IMPRESSIONS,
    },
    values: sufficient ? {
      clicks_change: change(current.clicks, previous.clicks),
      impressions_change: change(current.impressions, previous.impressions),
      ctr_change: change(current.ctr, previous.ctr),
      position_change: current.position - previous.position,
    } : null,
  }
}

function newRows(current, previous, key) {
  const previousKeys = new Set(previous.map((row) => row[key]))
  return current.filter((row) => row.impressions >= MIN_ROW_IMPRESSIONS && !previousKeys.has(row[key]))
}

async function runCommand(command, clients, period, limit, access) {
  const base = {
    generated_at: new Date().toISOString(),
    command,
    property: {
      site_url: PROPERTY,
      permission_level: access.property.permission_level,
      available_properties_count: access.properties.length,
    },
    period: period.current,
    previous_period: period.previous,
    data_note: 'Finalized GSC data only. Missing data for today is expected. Row-based reports contain the top rows returned by Search Console API.',
  }

  if (command === 'overview') {
    const [response, extra] = await Promise.all([
      searchAnalytics(clients.webmasters, period.current, [], 1),
      diagnostics(clients, access),
    ])
    return { ...base, totals: totalsFrom(response), diagnostics: extra }
  }

  const dimensions = {
    queries: ['query'],
    pages: ['page'],
    'query-pages': ['query', 'page'],
    countries: ['country'],
    devices: ['device'],
    'search-appearance': ['searchAppearance'],
  }
  if (dimensions[command]) {
    const response = await searchAnalytics(clients.webmasters, period.current, dimensions[command], limit)
    return {
      ...base,
      dimensions: dimensions[command],
      response_aggregation_type: response.responseAggregationType,
      row_count: response.rows?.length ?? 0,
      rows: normalizedRows(response, dimensions[command]),
    }
  }

  const current = await analyticsBundle(clients.webmasters, period.current, limit)
  const previous = await analyticsBundle(clients.webmasters, period.previous, limit)
  const opportunities = opportunityAnalysis(current, previous)
  if (command === 'opportunities') return { ...base, opportunities }

  const extra = await diagnostics(clients, access)
  return {
    ...base,
    totals: current.overview,
    comparison: comparison(current.overview, previous.overview),
    top_queries: current.queries.slice(0, Math.min(limit, 100)),
    top_pages: current.pages.slice(0, Math.min(limit, 100)),
    opportunities,
    new_queries: section(
      newRows(current.queries, previous.queries, 'query'),
      current.queries,
      'present in current top-row sample, absent from previous equal-period sample; at least 10 impressions',
      sum(current.queries, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS && sum(previous.queries, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS,
    ),
    new_pages: section(
      newRows(current.pages, previous.pages, 'page'),
      current.pages,
      'present in current top-row sample, absent from previous equal-period sample; at least 10 impressions',
      sum(current.pages, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS && sum(previous.pages, 'impressions') >= MIN_ANALYSIS_IMPRESSIONS,
    ),
    diagnostics: extra,
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const string = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string
}

function csvRows(report) {
  if (report.rows) return report.rows
  if (report.command === 'overview') return [{ section: 'overview', ...report.totals }]
  const rows = []
  if (report.totals) rows.push({ section: 'overview', ...report.totals })
  if (report.comparison) rows.push({
    section: 'period_comparison',
    status: report.comparison.status,
    ...report.comparison.sample,
    ...(report.comparison.values ?? {}),
  })
  for (const [name, value] of Object.entries(report.opportunities ?? {})) {
    if (value.rows.length) {
      value.rows.forEach((row) => rows.push({ section: name, status: value.status, ...value.sample, ...row }))
    } else {
      rows.push({ section: name, status: value.status, ...value.sample })
    }
  }
  for (const name of ['top_queries', 'top_pages']) {
    for (const row of report[name] ?? []) rows.push({ section: name, ...row })
  }
  for (const name of ['new_queries', 'new_pages']) {
    const value = report[name]
    if (!value) continue
    if (value.rows.length) value.rows.forEach((row) => rows.push({ section: name, status: value.status, ...value.sample, ...row }))
    else rows.push({ section: name, status: value.status, ...value.sample })
  }
  return rows
}

function csvHeaders(report) {
  if (!report.rows) return []
  const dimensions = (report.dimensions ?? []).map((dimension) => dimension === 'searchAppearance' ? 'search_appearance' : dimension)
  return [...dimensions, 'clicks', 'impressions', 'ctr', 'position']
}

function toCsv(rows, preferredHeaders = []) {
  const headers = [...new Set([...preferredHeaders, ...rows.flatMap((row) => Object.keys(row))])]
  if (!headers.length) return ''
  const body = rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  return `${headers.map(csvEscape).join(',')}\n${body.length ? `${body.join('\n')}\n` : ''}`
}

async function saveReport(report) {
  await mkdir(outputDirectory, { recursive: true })
  const stem = `${report.command}-${report.period.date1}-${report.period.date2}`
  const jsonPath = path.join(outputDirectory, `${stem}.json`)
  const csvPath = path.join(outputDirectory, `${stem}.csv`)
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(csvPath, toCsv(csvRows(report), csvHeaders(report)), 'utf8')
  return { jsonPath, csvPath }
}

function debug(stage) {
  if (process.env.GSC_DEBUG === '1') console.error(`GSC debug: ${stage}`)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    return
  }

  debug('authorize:start')
  const auth = await authorize()
  debug('authorize:done')
  const clients = createClients(auth)
  const access = await propertyAccess(clients.webmasters)
  debug('property-access:done')
  const availability = await discoverAvailability(clients.webmasters)
  debug('availability:done')
  const period = resolvePeriod(options, availability)
  const report = await runCommand(options.command, clients, period, options.limit, access)
  debug('command:done')
  report.available_data = availability
  const files = await saveReport(report)
  debug('save:done')

  console.log(`GSC ${options.command}: ${period.current.date1} — ${period.current.date2}`)
  console.log(`Property: ${PROPERTY} (${access.property.permission_level})`)
  console.log(`Available finalized data: ${availability.first} — ${availability.last}`)
  console.log(`JSON: ${path.relative(projectRoot, files.jsonPath)}`)
  console.log(`CSV: ${path.relative(projectRoot, files.csvPath)}`)
}

main().catch((error) => {
  console.error(`GSC CLI error: ${safeApiError(error).message}`)
  process.exitCode = 1
})
