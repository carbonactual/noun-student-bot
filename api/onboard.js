const { db, tenantId } = require('../lib/knowledge');

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = req.body || {};
    const full_name = clean(body.full_name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const phone = normalizePhone(body.phone);
    const study_level = clean(body.study_level, 40) || 'undergraduate';
    const programme_title = clean(body.programme_title, 180);
    const level = clean(body.level, 80);
    const help_need = clean(body.help_need, 800);

    if (!full_name || !email || !phone || !programme_title || !study_level) {
      return res.status(400).json({ error: 'full_name, email, phone, programme_title and study_level are required' });
    }

    const tenant_id = await tenantId();
    const payload = {
      tenant_id,
      phone,
      full_name,
      email,
      study_level,
      programme_title,
      level: level || null,
      updated_at: new Date().toISOString(),
      onboarding_source: 'web',
      whatsapp_opt_in: true,
      last_seen_at: new Date().toISOString()
    };

    const { data: existing, error: lookupError } = await db
      .from('students')
      .select('phone')
      .eq('tenant_id', tenant_id)
      .eq('phone', phone)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let data;
    if (existing) {
      const updated = await db.from('students').update(payload).eq('tenant_id', tenant_id).eq('phone', phone).select('phone,full_name,email,study_level,programme_title,level').single();
      if (updated.error) throw updated.error;
      data = updated.data;
    } else {
      const created = await db.from('students').insert(payload).select('phone,full_name,email,study_level,programme_title,level').single();
      if (created.error) throw created.error;
      data = created.data;
    }

    await db.from('student_activity').insert({
      tenant_id,
      phone,
      event_type: 'web_onboarding',
      topic: help_need || 'joined NOUN BOT',
      metadata: { source: 'web', help_need }
    });

    return res.status(200).json({
      ok: true,
      student: data,
      message: 'Your NOUN BOT profile is ready.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to create your NOUN BOT profile right now.' });
  }
};
