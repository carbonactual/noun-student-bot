// Official WhatsApp Business Cloud API sender (migration off the banned bridge, Oct 2026).
// Env: WA_CLOUD_TOKEN (permanent system-user token), WA_PHONE_NUMBER_ID,
//      WA_VERIFY_TOKEN (webhook handshake), WA_GRAPH_VERSION (default v23.0).
// Dormant until configured — legacy paths keep working untouched.

const { db, tenantId } = require('./knowledge');
const { nextRetry } = require('./outbound');

const VERSION = process.env.WA_GRAPH_VERSION || 'v23.0';
const TOKEN = () => process.env.WA_CLOUD_TOKEN || '';
const PHONE_ID = () => process.env.WA_PHONE_NUMBER_ID || '';

function isConfigured() { return !!(TOKEN() && PHONE_ID()); }

async function sendText(to, body) {
  if (!isConfigured()) return { ok: false, error: 'wa-cloud not configured' };
  const text = String(body || '').slice(0, 4096);
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID()}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: String(to).replace(/\D/g, ''),
        type: 'text',
        text: { body: text, preview_url: false }
      })
    });
    const d = await r.json().catch(() => ({}));
    const id = d && d.messages && d.messages[0] && d.messages[0].id;
    return { ok: r.ok && !!id, id: id || null, error: d && d.error ? d.error.message : null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Drain the outbound queue via the Cloud API — only to phones with inbound
// activity in the last 24h (free-form replies are only allowed inside the
// customer-service window; others stay queued for templates later).
async function drainOutbound(limit = 10) {
  if (!isConfigured()) return { sent: 0, skipped: 0, notConfigured: true };
  const t = await tenantId();
  const since = new Date(Date.now() - 23 * 3600 * 1000).toISOString();
  const { data: recent } = await db.from('message_events')
    .select('phone').eq('tenant_id', t).eq('direction', 'inbound')
    .gte('created_at', since).limit(500);
  const active = new Set((recent || []).map(r => String(r.phone).replace(/\D/g, '')).filter(Boolean));
  const now = new Date().toISOString();
  const { data: rows, error } = await db.from('outbound_queue')
    .select('*').eq('tenant_id', t).in('status', ['queued', 'processing'])
    .lte('available_at', now)
    .or(`locked_until.is.null,locked_until.lt.${now}`)
    .order('id').limit(Number(limit) || 10);
  if (error) throw error;
  let sent = 0, skipped = 0;
  for (const r of rows || []) {
    const phone = String(r.phone).replace(/\D/g, '');
    if (!active.has(phone)) { skipped++; continue; } // outside 24h window — leave queued
    await db.from('outbound_queue').update({ status: 'processing', attempts: (r.attempts || 0) + 1, locked_until: new Date(Date.now() + 300000).toISOString() }).eq('tenant_id', t).eq('id', r.id);
    const res = await sendText(phone, r.message_text);
    if (res.ok) {
      await db.from('outbound_queue').update({ status: 'sent', provider_message_id: res.id, sent_at: new Date().toISOString(), locked_until: null, last_error: null }).eq('tenant_id', t).eq('id', r.id);
      if (r.kind === 'campaign' && r.source_id) {
        await db.from('campaign_messages').update({ status: 'sent', provider_message_id: res.id, sent_at: new Date().toISOString() }).eq('tenant_id', t).eq('id', Number(r.source_id)).catch(() => {});
      }
      sent++;
    } else {
      const retry = nextRetry((r.attempts || 0) + 1);
      await db.from('outbound_queue').update({ status: retry.status, available_at: retry.available_at, last_error: res.error || 'send failed', locked_until: null }).eq('tenant_id', t).eq('id', r.id);
    }
  }
  return { sent, skipped };
}

module.exports = { isConfigured, sendText, drainOutbound };
