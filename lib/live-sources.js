const https = require('node:https');

const OFFICIAL_NOUN = {
  base: 'https://nou.edu.ng',
  authority_tier: 1,
  source_type: 'official_noun'
};

function clean(value, max = 12000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeSource(raw = {}, adapter = OFFICIAL_NOUN) {
  return {
    title: clean(raw.title, 240),
    url: clean(raw.url, 500),
    authority_tier: Number(adapter.authority_tier || 4),
    source_type: clean(adapter.source_type || 'external', 80),
    retrieved_at: new Date().toISOString(),
    verified_at: raw.verified_at || null,
    content: clean(raw.content),
    metadata: raw.metadata || {}
  };
}

function buildEvidence(rows = []) {
  return rows.filter(x => clean(x.content)).map(x => normalizeSource(x, x));
}

function fetchText(url, timeoutMs = 6000, maxBytes = 180000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'user-agent': 'NOUN-BOT/2.1 source retrieval',
        accept: 'text/html,text/plain;q=0.9,*/*;q=0.1'
      }
    }, res => {
      const status = res.statusCode || 500;
      if (status < 200 || status >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${status}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
        if (Buffer.byteLength(body, 'utf8') > maxBytes) req.destroy(new Error('source too large'));
      });
      res.on('end', () => resolve(body.slice(0, maxBytes)));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('source timeout')));
    req.on('error', reject);
  });
}

function extractText(html) {
  return clean(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' '),
    12000
  );
}

function queryTerms(query) {
  return [...new Set(String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2))].slice(0, 8);
}

function relevance(query, content) {
  const terms = queryTerms(query);
  const haystack = String(content || '').toLowerCase();
  return terms.length ? terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) / terms.length : 0;
}

async function fetchOfficialPath(path) {
  const url = new URL(path, OFFICIAL_NOUN.base).toString();
  const html = await fetchText(url);
  return normalizeSource({
    title: `NOUN ${path.replace(/\/+$/, '').split('/').filter(Boolean).join(' ') || 'home'}`,
    url,
    content: extractText(html)
  }, OFFICIAL_NOUN);
}

async function fetchLiveSources(query, options = {}) {
  const q = clean(query, 240);
  if (!q) return { facts: [], sources: [], confidence: 'low' };

  const paths = Array.isArray(options.paths) && options.paths.length
    ? options.paths.slice(0, 6)
    : ['/calendar/', '/faqs/', '/e-courseware/', '/news/', '/'];

  const settled = await Promise.allSettled(paths.map(fetchOfficialPath));
  const found = settled
    .filter(x => x.status === 'fulfilled')
    .map(x => x.value)
    .map(x => ({ ...x, relevance: relevance(q, x.content) }))
    .filter(x => x.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, options.limit || 5)
    .map(({ relevance: _relevance, ...x }) => x);

  return {
    facts: found,
    sources: found.map(x => ({ tier: x.authority_tier, title: x.title, url: x.url })),
    confidence: found.length ? 'high' : 'low'
  };
}

module.exports = { normalizeSource, buildEvidence, fetchLiveSources };
