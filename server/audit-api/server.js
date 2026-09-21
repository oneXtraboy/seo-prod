'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns').promises;
const { createEnrichmentHandler } = require('./enrichment');

const PORT = Number(process.env.PORT || 5680);
const ALLOWED_ORIGIN = String(process.env.AUDIT_ALLOWED_ORIGIN || 'https://synapsee.ru').replace(/\/$/, '');
const HASH_SECRET = String(process.env.AUDIT_HASH_SECRET || '');
const TELEGRAM_BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || '');
const TELEGRAM_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '');
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '');
const NOTIFY_EMAIL = String(process.env.AUDIT_NOTIFY_EMAIL || '');
const FROM_EMAIL = String(process.env.AUDIT_FROM_EMAIL || 'Synapsee <onboarding@resend.dev>');
const DATA_DIR = process.env.AUDIT_DATA_DIR || '/data';
const STORE_PATH = path.join(DATA_DIR, 'submissions.json');
const MAX_BODY_BYTES = 16 * 1024;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const usedChallenges = new Map();
let notificationRetryRunning = false;

if (HASH_SECRET.length < 32) {
  throw new Error('AUDIT_HASH_SECRET must contain at least 32 characters');
}

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

function loadRecords() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('submission store read failed', error.message);
    return [];
  }
}

let records = loadRecords().filter((item) => Number(item.createdAt) > Date.now() - RETENTION_MS);

function saveRecords() {
  const cutoff = Date.now() - RETENTION_MS;
  records = records.filter((item) => Number(item.createdAt) > cutoff).slice(-5000);
  const temporary = `${STORE_PATH}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(records, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, STORE_PATH);
  fs.chmodSync(STORE_PATH, 0o600);
}

saveRecords();

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  });
  res.end(payload);
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function fingerprint(value) {
  return crypto.createHmac('sha256', HASH_SECRET).update(String(value || '').toLowerCase()).digest('hex');
}

function getClientIp(req) {
  const realIp = String(req.headers['x-real-ip'] || '').trim();
  return realIp || req.socket.remoteAddress || 'unknown';
}

function getOrigin(req) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (origin) return origin;
  const referer = String(req.headers.referer || '');
  try { return new URL(referer).origin; } catch { return ''; }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const type = String(req.headers['content-type'] || '').split(';')[0].trim();
      try {
        if (type === 'application/json') return resolve(JSON.parse(raw || '{}'));
        if (type === 'application/x-www-form-urlencoded') return resolve(Object.fromEntries(new URLSearchParams(raw)));
        reject(Object.assign(new Error('unsupported_media_type'), { status: 415 }));
      } catch {
        reject(Object.assign(new Error('invalid_body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function signChallenge(payload) {
  return crypto.createHmac('sha256', HASH_SECRET).update(payload).digest('base64url');
}

function createChallenge() {
  const first = crypto.randomInt(2, 10);
  const second = crypto.randomInt(1, 10);
  const data = {
    first,
    second,
    nonce: crypto.randomBytes(12).toString('base64url'),
    expiresAt: Date.now() + 15 * 60 * 1000
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  return { token: `${encoded}.${signChallenge(encoded)}`, question: `${first} + ${second}` };
}

function verifyChallenge(token, answer) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature || usedChallenges.has(encoded)) return false;
  const expected = signChallenge(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!data.nonce || Number(data.expiresAt) < Date.now()) return false;
    if (Number(answer) !== Number(data.first) + Number(data.second)) return false;
    usedChallenges.set(encoded, Number(data.expiresAt));
    return true;
  } catch {
    return false;
  }
}

function pruneChallenges() {
  const now = Date.now();
  for (const [token, expiresAt] of usedChallenges.entries()) {
    if (expiresAt < now) usedChallenges.delete(token);
  }
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length < 10 || digits.length > 15) return '';
  if (/^(\d)\1+$/.test(digits)) return '';
  if (/0123456789|1234567890|9876543210/.test(digits)) return '';
  return `+${digits}`;
}

function normalizeEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return '';
  return email;
}

function normalizeContact(value) {
  const contact = cleanText(value, 254);
  const email = normalizeEmail(contact);
  if (email) return { value: email, email };
  if (/^@[A-Za-z0-9_]{5,32}$/.test(contact)) return { value: contact, email: '' };
  return null;
}

function normalizeWebsite(value) {
  try {
    const url = new URL(cleanText(value, 500));
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

async function hasMailServer(email) {
  try {
    const domain = email.split('@')[1];
    const mx = await dns.resolveMx(domain);
    return mx.length > 0;
  } catch {
    return false;
  }
}

async function websiteResolves(url) {
  try {
    await dns.lookup(url.hostname);
    return true;
  } catch {
    return false;
  }
}

function rateLimit(ipHash) {
  const now = Date.now();
  const hour = records.filter((item) => item.ipHash === ipHash && item.createdAt > now - 60 * 60 * 1000).length;
  const day = records.filter((item) => item.ipHash === ipHash && item.createdAt > now - 24 * 60 * 60 * 1000).length;
  return hour >= 4 || day >= 12;
}

function isDuplicate(hashes) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return records.some((item) => item.createdAt > cutoff && (
    (item.emailHash === hashes.emailHash && item.siteHash === hashes.siteHash) ||
    (hashes.phoneHash && item.phoneHash === hashes.phoneHash && item.siteHash === hashes.siteHash)
  ));
}

function escapeTelegram(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


async function notifyTelegram(record) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) throw new Error('telegram_not_configured');
  const message = [
    '<b>Новая заявка на аудит Synapsee</b>',
    `<b>ID:</b> ${escapeTelegram(record.id)}`,
    `<b>Имя:</b> ${escapeTelegram(record.name)}`,
    `<b>Контакт:</b> ${escapeTelegram(record.contact || record.email)}`,
    ...(record.phone ? [`<b>Телефон:</b> ${escapeTelegram(record.phone)}`] : []),
    `<b>Сайт:</b> ${escapeTelegram(record.website)}`,
    `<b>Услуга:</b> ${escapeTelegram(record.serviceLabel || record.service)}`,
    ...(record.goal ? [`<b>Цель:</b> ${escapeTelegram(record.goal)}`] : []),
    `<b>Источник:</b> ${escapeTelegram(record.source)}`
  ].join('\n');
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`telegram_http_${response.status}`);
}

async function notifyEmail(record) {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) throw new Error('email_not_configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
      'idempotency-key': record.id
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      ...(record.email ? { reply_to: record.email } : {}),
      subject: `Заявка на аудит ${record.website}`,
      text: [
        'Новая заявка на аудит Synapsee',
        `ID: ${record.id}`,
        `Имя: ${record.name}`,
        `Контакт: ${record.contact || record.email}`,
        ...(record.phone ? [`Телефон: ${record.phone}`] : []),
        `Сайт: ${record.website}`,
        `Услуга: ${record.serviceLabel || record.service}`,
        ...(record.goal ? [`Цель: ${record.goal}`] : []),
        `Источник: ${record.source}`
      ].join('\n')
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    const details = cleanText(await response.text(), 300);
    throw new Error(`email_http_${response.status}${details ? `_${details}` : ''}`);
  }
}

async function deliverNotifications(record) {
  if (!record.telegramSent && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await notifyTelegram(record);
      record.telegramSent = true;
    } catch (error) {
      console.error('telegram notification failed', record.id, error.message);
    }
  }
  if (!record.emailSent && RESEND_API_KEY && NOTIFY_EMAIL) {
    try {
      await notifyEmail(record);
      record.emailSent = true;
    } catch (error) {
      console.error('email notification failed', record.id, error.message);
    }
  }
  record.notificationSent = Boolean(record.telegramSent || record.emailSent);
}

async function retryPendingNotifications() {
  if (notificationRetryRunning) return;
  notificationRetryRunning = true;
  try {
    const pending = records.filter((record) =>
      (!record.telegramSent && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) ||
      (!record.emailSent && RESEND_API_KEY && NOTIFY_EMAIL)
    ).slice(-100);
    if (!pending.length) return;
    for (const record of pending) await deliverNotifications(record);
    saveRecords();
  } finally {
    notificationRetryRunning = false;
  }
}

async function handleSubmission(req, res) {
  if (getOrigin(req) !== ALLOWED_ORIGIN) return sendJson(res, 403, { ok: false, code: 'origin' });
  const ipHash = fingerprint(getClientIp(req));
  if (rateLimit(ipHash)) return sendJson(res, 429, { ok: false, code: 'rate_limit' });

  const body = await parseBody(req);
  if (cleanText(body.company, 200)) return sendJson(res, 202, { ok: true });

  const startedAt = Number(body.started_at || 0);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 1500 || elapsed > 2 * 60 * 60 * 1000) {
    return sendJson(res, 400, { ok: false, code: 'timing' });
  }
  if (!verifyChallenge(body.challenge_token, body.challenge_answer)) {
    return sendJson(res, 400, { ok: false, code: 'challenge' });
  }
  if (String(body.privacy_consent || '') !== 'yes') {
    return sendJson(res, 400, { ok: false, code: 'consent' });
  }

  const formType = cleanText(body.form_type, 30);
  const compactSubmission = ["seo_quiz", "quick_lead"].includes(formType);
  const contact = compactSubmission ? normalizeContact(body.contact) : null;
  const name = formType === "seo_quiz" ? "SEO-квиз" : compactSubmission ? "Заявка с сайта" : cleanText(body.name, 100);
  const email = compactSubmission ? (contact?.email || "") : normalizeEmail(body.email);
  const phone = compactSubmission ? "" : normalizePhone(body.phone);
  const websiteUrl = normalizeWebsite(body.website);
  if (name.length < 2 || (!compactSubmission && (!email || !phone)) || (compactSubmission && !contact) || !websiteUrl) {
    return sendJson(res, 400, { ok: false, code: "fields" });
  }
  const [mailOk, websiteOk] = await Promise.all([email ? hasMailServer(email) : true, websiteResolves(websiteUrl)]);
  if (email && !mailOk) return sendJson(res, 400, { ok: false, code: 'email_domain' });
  if (!websiteOk) return sendJson(res, 400, { ok: false, code: 'website_domain' });

  const hashes = {
    emailHash: fingerprint(contact?.value || email),
    phoneHash: phone ? fingerprint(phone) : '',
    siteHash: fingerprint(websiteUrl.hostname)
  };
  if (isDuplicate(hashes)) return sendJson(res, 409, { ok: false, code: 'duplicate' });

  const enrichmentToken = crypto.randomBytes(24).toString('base64url');
  const record = {
    id: `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    createdAt: Date.now(),
    name,
    email,
    phone,
    contact: contact?.value || email,
    website: websiteUrl.toString(),
    source: cleanText(body.source, 160) || 'Сайт',
    service: cleanText(body.service, 160) || 'general',
    serviceLabel: cleanText(body.service_label, 200) || cleanText(body.service, 160) || 'Предварительный разбор сайта',
    goal: cleanText(body.goal, 160),
    enrichmentHash: fingerprint(enrichmentToken),
    enrichment: null,
    ipHash,
    ...hashes,
    notificationSent: false,
    telegramSent: false,
    emailSent: false
  };
  records.push(record);
  saveRecords();

  await deliverNotifications(record);
  saveRecords();

  return sendJson(res, 201, { ok: true, id: record.id, enrichment_token: enrichmentToken });
}

const handleEnrichment = createEnrichmentHandler({ getRecords: () => records, saveRecords, sendJson });

const server = http.createServer(async (req, res) => {
  try {
    pruneChallenges();
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/api/audit/challenge') {
      return sendJson(res, 200, { ok: true, ...createChallenge() });
    }
    if (req.method === 'POST' && url.pathname === '/api/audit' && url.searchParams.get('step') === 'enrich') {
      const body = await parseBody(req);
      return await handleEnrichment(req, res, body);
    }
    if (req.method === 'POST' && url.pathname === '/api/audit') return await handleSubmission(req, res);
    if (req.method === 'POST' && url.pathname === '/api/audit/enrich') {
      const body = await parseBody(req);
      return await handleEnrichment(req, res, body);
    }
    return sendJson(res, 404, { ok: false, code: 'not_found' });
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error('audit api error', error);
    return sendJson(res, status, { ok: false, code: status >= 500 ? 'server' : error.message });
  }
});

server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`synapsee audit api listening on ${PORT}`));
setTimeout(() => retryPendingNotifications().catch((error) => console.error('notification retry failed', error.message)), 5000);
setInterval(() => retryPendingNotifications().catch((error) => console.error('notification retry failed', error.message)), 15 * 60 * 1000).unref();

