const { COURSE_MAP, SELECTION_RULES, SESSION_RULE, OFFICIAL_EXAM_FEES, PROGRAMME_DIRECTORY, validateSelection } = require('./cibn-catalog');

const DEFAULT_ALLOWED = [
  'https://mcp-bot-eight.vercel.app',
  'https://mcp-bot.vercel.app'
];

function allowedOrigins() {
  return (process.env.CIBN_CHAT_ORIGINS || DEFAULT_ALLOWED.join(','))
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

function configureCors(req, res) {
  const origin = req.headers?.origin;
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.setHeader('Content-Type', 'application/json');
}

function cibnCatalogHandler(req, res) {
  configureCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { return res.status(400).json({ error: 'invalid_json' }); }
    }
    body = body && typeof body === 'object' ? body : {};
    const codes = Array.isArray(body.codes)
      ? body.codes.map(x => String(x).trim().toUpperCase()).filter(Boolean).slice(0, 50)
      : String(body.codes || '').toUpperCase().split(/[\s,;]+/).filter(Boolean).slice(0, 50);
    if (!codes.length) return res.status(400).json({ error: 'codes_required' });
    const result = validateSelection(codes, {
      program: String(body.program || ''),
      level: String(body.level || '')
    });
    return res.status(200).json({
      ok: true,
      mode: 'selection-validation',
      ...result
    });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'GET or POST only' });

  return res.status(200).json({
    ok: true,
    catalog_version: '2026-10-official-timetable',
    generated_at: new Date().toISOString(),
    sources: {
      timetable: 'cibn_official_october_2026_timetable_pdf',
      programme_pages: 'cibn_official_current_programme_pages',
      portal_observations: 'owner_portal_screenshot_2026-09-17'
    },
    courses: COURSE_MAP,
    selection_rules: SELECTION_RULES,
    session_rule: SESSION_RULE,
    official_exam_fees: OFFICIAL_EXAM_FEES,
    programmes: PROGRAMME_DIRECTORY
  });
}

module.exports = { cibnCatalogHandler };
