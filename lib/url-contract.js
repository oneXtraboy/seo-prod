const FILE_EXTENSION_RE = /\.[a-z0-9]{1,10}$/i;
const SPECIAL_SCHEME_RE = /^(?:mailto:|tel:|javascript:|data:)/i;
const ABSOLUTE_HTTP_RE = /^https?:\/\//i;
const PROTOCOL_RELATIVE_RE = /^\/\//;

function siteBaseUrl(siteUrl) {
  return String(siteUrl || '').trim().replace(/\/+$/, '');
}

function splitPathSuffix(value) {
  const input = String(value || '').trim();
  const queryIndex = input.indexOf('?');
  const hashIndex = input.indexOf('#');
  const suffixIndexes = [queryIndex, hashIndex].filter((index) => index >= 0);
  if (!suffixIndexes.length) return { pathname: input, suffix: '' };
  const suffixStart = Math.min(...suffixIndexes);
  return { pathname: input.slice(0, suffixStart), suffix: input.slice(suffixStart) };
}

function isFileLikePath(pathname) {
  const pathOnly = String(pathname || '').split('?')[0].split('#')[0];
  if (!pathOnly || pathOnly === '/') return false;
  if (pathOnly.startsWith('/assets/')) return true;
  const lastSegment = pathOnly.split('/').filter(Boolean).pop() || '';
  return FILE_EXTENSION_RE.test(lastSegment);
}

function normalizeInternalHtmlPath(value) {
  const { pathname, suffix } = splitPathSuffix(value);
  let pathValue = String(pathname || '').trim();
  if (!pathValue) pathValue = '/';
  pathValue = pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
  pathValue = pathValue.replace(/\/index\.html$/i, '/').replace(/\/{2,}/g, '/');
  if (pathValue !== '/' && !isFileLikePath(pathValue) && !pathValue.endsWith('/')) {
    pathValue = `${pathValue}/`;
  }
  return `${pathValue}${suffix}`;
}

function isSpecialHref(value) {
  const input = String(value || '').trim();
  return !input || input.startsWith('#') || SPECIAL_SCHEME_RE.test(input) || PROTOCOL_RELATIVE_RE.test(input);
}

function normalizeHref(value, siteUrl = '') {
  const input = String(value || '').trim();
  if (isSpecialHref(input)) return input;
  if (ABSOLUTE_HTTP_RE.test(input)) {
    const base = siteBaseUrl(siteUrl);
    let parsed;
    try {
      parsed = new URL(input);
    } catch (_) {
      return input;
    }
    if (!base || parsed.origin !== base) return input;
    parsed.pathname = normalizeInternalHtmlPath(parsed.pathname);
    return parsed.toString();
  }
  return normalizeInternalHtmlPath(input);
}

function canonicalUrl(siteUrl, pathOrUrl) {
  const base = siteBaseUrl(siteUrl);
  const input = String(pathOrUrl || '/').trim();
  if (ABSOLUTE_HTTP_RE.test(input)) return normalizeHref(input, base);
  return `${base}${normalizeInternalHtmlPath(input)}`;
}

function normalizeStructuredDataUrls(value, siteUrl) {
  if (Array.isArray(value)) return value.map((item) => normalizeStructuredDataUrls(item, siteUrl));
  if (!value || typeof value !== 'object') return value;
  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && /^(?:url|@id)$/i.test(key)) {
      next[key] = ABSOLUTE_HTTP_RE.test(child) || child.startsWith('/') ? canonicalUrl(siteUrl, child) : child;
    } else {
      next[key] = normalizeStructuredDataUrls(child, siteUrl);
    }
  }
  return next;
}

function normalizeGeneratedHtmlLinks(html, siteUrl) {
  return String(html || '').replace(/\bhref=("|')([^"']*)(\1)/g, (_match, quote, href) => {
    return `href=${quote}${normalizeHref(href, siteUrl)}${quote}`;
  });
}

module.exports = {
  canonicalUrl,
  isFileLikePath,
  normalizeGeneratedHtmlLinks,
  normalizeHref,
  normalizeInternalHtmlPath,
  normalizeStructuredDataUrls,
  siteBaseUrl
};
