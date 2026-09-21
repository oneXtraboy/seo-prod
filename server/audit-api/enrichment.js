'use strict';

const crypto = require('node:crypto');

const ALLOWED_ORIGIN = String(process.env.AUDIT_ALLOWED_ORIGIN || 'https://synapsee.ru').replace(/\/$/, '');
const HASH_SECRET = String(process.env.AUDIT_HASH_SECRET || '');

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function fingerprint(value) {
  return crypto.createHmac('sha256', HASH_SECRET).update(String(value || '').toLowerCase()).digest('hex');
}

function getOrigin(req) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (origin) return origin;
  const referer = String(req.headers.referer || '');
  try { return new URL(referer).origin; } catch { return ''; }
}

function createEnrichmentHandler({ getRecords, saveRecords, sendJson }) {
  return async function handleEnrichment(req, res, body) {
    if (getOrigin(req) !== ALLOWED_ORIGIN) return sendJson(res, 403, { ok: false, code: 'origin' });
    const id = cleanText(body.id, 80);
    const token = cleanText(body.enrichment_token, 120);
    const record = getRecords().find((item) => item.id === id);
    if (!record || !token || record.enrichmentHash !== fingerprint(token)) {
      return sendJson(res, 403, { ok: false, code: 'enrichment' });
    }

    record.enrichment = {
      niche: cleanText(body.niche, 120),
      region: cleanText(body.region, 120),
      task: cleanText(body.task, 700),
      tried: cleanText(body.tried, 240),
      team: cleanText(body.team, 240),
      updatedAt: Date.now(),
    };
    record.enrichmentHash = '';
    saveRecords();
    return sendJson(res, 200, { ok: true, id: record.id });
  };
}

module.exports = { createEnrichmentHandler };
