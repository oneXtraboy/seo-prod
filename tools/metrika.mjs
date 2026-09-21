#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const API_ORIGIN = 'https://api-metrika.yandex.net'
const COMMANDS = new Set(['overview', 'sources', 'organic', 'landing-pages', 'pages', 'goals', 'seo'])
const REQUIRED_GOALS = ['form_start', 'form_step_1_submit', 'form_complete']
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(projectRoot, 'reports', 'metrika')

const sessionMetrics = {
  visits: 'ym:s:visits',
  users: 'ym:s:users',
  pageviews: 'ym:s:pageviews',
}
const overviewMetrics = {
  ...sessionMetrics,
  new_users: 'ym:s:newUsers',
  bounce_rate: 'ym:s:bounceRate',
  page_depth: 'ym:s:pageDepth',
  avg_visit_duration_seconds: 'ym:s:avgVisitDurationSeconds',
}

function usage() {
  return `Usage:
  node --env-file=.env.local tools/metrika.mjs <command> [date1] [date2]
  node --env-file=.env.local tools/metrika.mjs <command> --date1 YYYY-MM-DD --date2 YYYY-MM-DD [--limit N]

Commands:
  overview
  sources
  organic
  landing-pages
  pages
  goals
  seo

Defaults:
  date1=29daysAgo
  date2=today
  limit=100`
}

function readOptionValue(args, index, name) {
  const argument = args[index]
  if (argument === name) {
    const value = args[index + 1]
    if (!value) throw new Error(`Missing value for ${name}`)
    return { value, consumed: 2 }
  }
  if (argument.startsWith(`${name}=`)) return { value: argument.slice(name.length + 1), consumed: 1 }
  return null
}

function validateDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && !/^(today|yesterday|\d+daysAgo)$/.test(value)) {
    throw new Error(`${name} must be YYYY-MM-DD, today, yesterday, or NdaysAgo`)
  }
}

function parseArguments(argv) {
  const [command, ...args] = argv
  if (!command || command === '--help' || command === '-h') return { help: true }
  if (!COMMANDS.has(command)) throw new Error(`Unknown command: ${command}\n\n${usage()}`)

  const positionals = []
  let date1
  let date2
  let limit = 100

  for (let index = 0; index < args.length;) {
    const date1Option = readOptionValue(args, index, '--date1')
    if (date1Option) {
      date1 = date1Option.value
      index += date1Option.consumed
      continue
    }
    const date2Option = readOptionValue(args, index, '--date2')
    if (date2Option) {
      date2 = date2Option.value
      index += date2Option.consumed
      continue
    }
    const limitOption = readOptionValue(args, index, '--limit')
    if (limitOption) {
      limit = Number(limitOption.value)
      index += limitOption.consumed
      continue
    }
    if (args[index].startsWith('-')) throw new Error(`Unknown option: ${args[index]}`)
    positionals.push(args[index])
    index += 1
  }

  if (positionals.length > 2) throw new Error('Pass at most date1 and date2 as positional arguments')
  date1 ??= positionals[0] ?? '29daysAgo'
  date2 ??= positionals[1] ?? 'today'
  validateDate(date1, 'date1')
  validateDate(date2, 'date2')
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) throw new Error('--limit must be an integer from 1 to 100000')

  return { command, date1, date2, limit, help: false }
}

function requireConfiguration() {
  if (!process.env.YANDEX_METRIKA_TOKEN) {
    throw new Error('YANDEX_METRIKA_TOKEN is missing. Run Node with --env-file=.env.local')
  }
  const counterId = process.env.YANDEX_METRIKA_COUNTER_ID
  if (!counterId || !/^\d+$/.test(counterId)) {
    throw new Error('YANDEX_METRIKA_COUNTER_ID must be a numeric counter ID')
  }
  return counterId
}

async function apiGet(pathname, query = {}) {
  const url = new URL(pathname, API_ORIGIN)
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') url.searchParams.set(name, String(value))
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `OAuth ${process.env.YANDEX_METRIKA_TOKEN}`,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const apiMessage = body?.message || body?.errors?.[0]?.message || response.statusText
    throw new Error(`Yandex Metrika API GET ${url.pathname} failed: HTTP ${response.status} ${apiMessage}`)
  }
  return body
}

async function stat(counterId, period, definition) {
  const query = {
    ids: counterId,
    date1: period.date1,
    date2: period.date2,
    accuracy: 'full',
    lang: 'ru',
    limit: definition.limit ?? period.limit,
    metrics: Object.values(definition.metrics).join(','),
    dimensions: definition.dimensions ? Object.values(definition.dimensions).join(',') : undefined,
    filters: definition.filters,
    sort: definition.sort,
  }
  const response = await apiGet('/stat/v1/data', query)
  return normalizeStat(response, definition)
}

function normalizeStat(response, definition) {
  const dimensionKeys = Object.keys(definition.dimensions ?? {})
  const metricKeys = Object.keys(definition.metrics)
  const rows = (response.data ?? []).map((row) => {
    const normalized = {}
    dimensionKeys.forEach((key, index) => {
      const dimension = row.dimensions?.[index]
      normalized[key] = dimension?.name ?? dimension?.id ?? ''
      if (dimension?.id !== undefined && String(dimension.id) !== String(normalized[key])) {
        normalized[`${key}_id`] = dimension.id
      }
    })
    metricKeys.forEach((key, index) => {
      normalized[key] = row.metrics?.[index] ?? 0
    })
    return normalized
  })

  const totals = {}
  metricKeys.forEach((key, index) => {
    totals[key] = response.totals?.[index] ?? 0
  })

  return {
    period: {
      date1: response.query?.date1,
      date2: response.query?.date2,
    },
    sampled: response.sampled ?? false,
    sample_share: response.sample_share ?? 1,
    totals,
    rows,
  }
}

function goalEventId(goal) {
  return goal.conditions?.find((condition) => REQUIRED_GOALS.includes(condition.url))?.url
}

async function resolveGoals(counterId) {
  const response = await apiGet(`/management/v1/counter/${counterId}/goals`)
  const resolved = new Map()

  for (const goal of response.goals ?? []) {
    const event = goalEventId(goal)
    if (event && !resolved.has(event)) {
      resolved.set(event, {
        event,
        id: goal.id,
        name: goal.name,
        type: goal.type,
        status: goal.status,
      })
    }
  }

  const missing = REQUIRED_GOALS.filter((event) => !resolved.has(event))
  if (missing.length) throw new Error(`Required Yandex Metrika goals not found: ${missing.join(', ')}`)
  return REQUIRED_GOALS.map((event) => resolved.get(event))
}

function goalMetrics(goals) {
  const metrics = {}
  for (const goal of goals) {
    metrics[`${goal.event}_reaches`] = `ym:s:goal${goal.id}reaches`
    metrics[`${goal.event}_visits`] = `ym:s:goal${goal.id}visits`
    metrics[`${goal.event}_users`] = `ym:s:goal${goal.id}users`
    metrics[`${goal.event}_conversion_rate`] = `ym:s:goal${goal.id}conversionRate`
  }
  return metrics
}

function goalRows(goals, totals) {
  return goals.map((goal) => ({
    event: goal.event,
    goal_id: goal.id,
    goal_name: goal.name,
    status: goal.status,
    reaches: totals[`${goal.event}_reaches`] ?? 0,
    converted_visits: totals[`${goal.event}_visits`] ?? 0,
    converted_users: totals[`${goal.event}_users`] ?? 0,
    conversion_rate: totals[`${goal.event}_conversion_rate`] ?? 0,
  }))
}

const definitions = {
  overview: {
    metrics: overviewMetrics,
  },
  sources: {
    dimensions: { traffic_source: 'ym:s:trafficSource' },
    metrics: {
      ...sessionMetrics,
      bounce_rate: 'ym:s:bounceRate',
    },
    sort: '-ym:s:visits',
  },
  organic: {
    dimensions: { search_engine: 'ym:s:searchEngine' },
    metrics: {
      ...sessionMetrics,
      bounce_rate: 'ym:s:bounceRate',
    },
    filters: "ym:s:trafficSource=='organic'",
    sort: '-ym:s:visits',
  },
  'landing-pages': {
    dimensions: { landing_page: 'ym:s:startURL' },
    metrics: {
      ...sessionMetrics,
      bounce_rate: 'ym:s:bounceRate',
    },
    sort: '-ym:s:visits',
  },
  pages: {
    dimensions: { page: 'ym:pv:URL' },
    metrics: {
      pageviews: 'ym:pv:pageviews',
      users: 'ym:pv:users',
    },
    sort: '-ym:pv:pageviews',
  },
}

async function runSimpleCommand(command, counterId, period) {
  const table = await stat(counterId, period, definitions[command])
  const rows = table.rows.length ? table.rows : [table.totals]
  return {
    report: {
      command,
      counter_id: Number(counterId),
      generated_at: new Date().toISOString(),
      period: table.period,
      sampled: table.sampled,
      sample_share: table.sample_share,
      totals: table.totals,
      rows: table.rows,
    },
    csvRows: rows,
  }
}

async function runGoals(counterId, period) {
  const goals = await resolveGoals(counterId)
  const table = await stat(counterId, period, { metrics: goalMetrics(goals) })
  const rows = goalRows(goals, table.totals)
  return {
    report: {
      command: 'goals',
      counter_id: Number(counterId),
      generated_at: new Date().toISOString(),
      period: table.period,
      sampled: table.sampled,
      sample_share: table.sample_share,
      goals: rows,
    },
    csvRows: rows,
  }
}

async function runSeo(counterId, period) {
  const goals = await resolveGoals(counterId)
  const goalsDefinition = { metrics: goalMetrics(goals) }
  const organicSummaryDefinition = {
    metrics: sessionMetrics,
    filters: "ym:s:trafficSource=='organic'",
  }

  const [overview, organicSummary, searchEngines, landingPages, pages, goalStats] = await Promise.all([
    stat(counterId, period, definitions.overview),
    stat(counterId, period, organicSummaryDefinition),
    stat(counterId, period, definitions.organic),
    stat(counterId, period, definitions['landing-pages']),
    stat(counterId, period, definitions.pages),
    stat(counterId, period, goalsDefinition),
  ])

  const goalsRows = goalRows(goals, goalStats.totals)
  const complete = goalsRows.find((goal) => goal.event === 'form_complete')
  const summary = {
    visits: overview.totals.visits,
    users: overview.totals.users,
    pageviews: overview.totals.pageviews,
    organic_visits: organicSummary.totals.visits,
    organic_users: organicSummary.totals.users,
    organic_pageviews: organicSummary.totals.pageviews,
    form_start: goalsRows.find((goal) => goal.event === 'form_start')?.reaches ?? 0,
    form_step_1_submit: goalsRows.find((goal) => goal.event === 'form_step_1_submit')?.reaches ?? 0,
    form_complete: complete?.reaches ?? 0,
    form_complete_conversion_rate: complete?.conversion_rate ?? 0,
  }
  const resolvedPeriod = overview.period
  const sampled = [overview, organicSummary, searchEngines, landingPages, pages, goalStats].some((item) => item.sampled)

  const csvRows = [
    { section: 'summary', ...summary },
    ...searchEngines.rows.map((row) => ({ section: 'search_engines', ...row })),
    ...landingPages.rows.map((row) => ({ section: 'landing_pages', ...row })),
    ...pages.rows.map((row) => ({ section: 'pages', ...row })),
    ...goalsRows.map((row) => ({ section: 'goals', ...row })),
  ]

  return {
    report: {
      command: 'seo',
      counter_id: Number(counterId),
      generated_at: new Date().toISOString(),
      period: resolvedPeriod,
      sampled,
      summary,
      search_engines: searchEngines.rows,
      landing_pages: landingPages.rows,
      popular_pages: pages.rows,
      goals: goalsRows,
    },
    csvRows,
  }
}

function csvValue(value) {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(rows) {
  const columns = []
  const known = new Set()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!known.has(key)) {
        known.add(key)
        columns.push(key)
      }
    }
  }
  if (!columns.length) return ''
  return [
    columns.map(csvValue).join(','),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(',')),
  ].join('\n') + '\n'
}

function safeDateForFilename(value) {
  return String(value || 'unknown').replace(/[^0-9A-Za-z-]/g, '-')
}

async function saveReport(command, result) {
  await mkdir(outputDirectory, { recursive: true })
  const date1 = safeDateForFilename(result.report.period?.date1)
  const date2 = safeDateForFilename(result.report.period?.date2)
  const baseName = `${command}-${date1}-${date2}`
  const jsonPath = path.join(outputDirectory, `${baseName}.json`)
  const csvPath = path.join(outputDirectory, `${baseName}.csv`)

  await Promise.all([
    writeFile(jsonPath, JSON.stringify(result.report, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 }),
    writeFile(csvPath, toCsv(result.csvRows), { encoding: 'utf8', mode: 0o600 }),
  ])

  return { jsonPath, csvPath }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    return
  }

  const counterId = requireConfiguration()
  const period = { date1: options.date1, date2: options.date2, limit: options.limit }
  let result

  if (options.command === 'goals') result = await runGoals(counterId, period)
  else if (options.command === 'seo') result = await runSeo(counterId, period)
  else result = await runSimpleCommand(options.command, counterId, period)

  const files = await saveReport(options.command, result)
  console.log(`Yandex Metrika report: ${options.command}`)
  console.log(`Counter: ${counterId}`)
  console.log(`Period: ${result.report.period.date1} — ${result.report.period.date2}`)
  console.log(`JSON: ${path.relative(projectRoot, files.jsonPath)}`)
  console.log(`CSV: ${path.relative(projectRoot, files.csvPath)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
