const { createClient } = require('@supabase/supabase-js');
const { tenantId } = require('../lib/knowledge');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function setOptIn(phone, enabled) {
  const tid = await tenantId();
  const now = new Date().toISOString();
  const { data: existing, error: lookupError } = await db
    .from('students')
    .select('phone,tenant_id')
    .eq('tenant_id', tid)
    .eq('phone', phone)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await db
      .from('students')
      .update({
        whatsapp_opt_in: enabled,
        updated_at: now,
        last_seen_at: now
      })
      .eq('tenant_id', tid)
      .eq('phone', phone);
    if (error) throw error;
    return;
  }

  const { error } = await db
    .from('students')
    .insert({
      tenant_id: tid,
      phone,
      whatsapp_opt_in: enabled,
      updated_at: now,
      last_seen_at: now
    });
  if (error) throw error;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.WEBHOOK_SECRET || req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const phone = String(req.body?.from || '').replace(/\D/g, '');
  const command = String(req.body?.text || '').trim().toLowerCase();
  if (!phone) return res.status(400).json({ error: 'from required' });

  try {
    if (['stop', 'unsubscribe', 'optout', 'opt out'].includes(command)) {
      await setOptIn(phone, false);
      return res.status(200).json({
        reply: 'You are unsubscribed from NOUN Student Bot WhatsApp campaigns and reminders. Reply START anytime to opt back in.',
        to: phone
      });
    }

    if (['start', 'subscribe', 'optin', 'opt in'].includes(command)) {
      await setOptIn(phone, true);
      return res.status(200).json({
        reply: '✅ WhatsApp notifications are enabled again. Reply HELP for the menu.',
        to: phone
      });
    }

    return res.status(200).json({ reply: null, to: phone });
  } catch (error) {
    console.error('preferences:', error);
    return res.status(500).json({ error: 'Preference update failed' });
  }
};
