const crypto = require('crypto');

function fingerprint(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

function normalizeText(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

async function monitorSource(supabase, source, fetcher) {
  const run = { tenant_id: source.tenant_id, source_id: source.id, status: 'running' };
  const { data: runRow, error: runError } = await supabase.from('source_monitor_runs').insert(run).select('id').single();
  if (runError) throw runError;
  try {
    const result = await fetcher(source.url);
    const normalized = normalizeText(result.content);
    const hash = fingerprint(normalized);
    const changed = hash !== source.last_fingerprint;
    await supabase.from('source_monitor_runs').update({ finished_at: new Date().toISOString(), status: 'completed', http_status: result.status || null, changed, metadata: { contentLength: normalized.length } }).eq('id', runRow.id);
    await supabase.from('knowledge_sources').update({ last_checked_at: new Date().toISOString(), ...(changed ? { last_changed_at: new Date().toISOString(), last_fingerprint: hash } : {}) }).eq('id', source.id);
    return { changed, hash, content: normalized, status: result.status || null };
  } catch (error) {
    await supabase.from('source_monitor_runs').update({ finished_at: new Date().toISOString(), status: 'failed', error: error.message }).eq('id', runRow.id);
    throw error;
  }
}

async function monitorDueSources(supabase, fetcher, limit = 10) {
  const { data, error } = await supabase.from('knowledge_sources').select('*').eq('active', true).limit(limit);
  if (error) throw error;
  const results = [];
  for (const source of data || []) {
    const last = source.last_checked_at ? new Date(source.last_checked_at).getTime() : 0;
    const due = !last || Date.now() - last >= Number(source.check_interval_minutes || 360) * 60000;
    if (!due) continue;
    try { results.push({ sourceId: source.id, ...(await monitorSource(supabase, source, fetcher)) }); }
    catch (error) { results.push({ sourceId: source.id, error: error.message }); }
  }
  return results;
}

module.exports = { fingerprint, normalizeText, monitorSource, monitorDueSources };
