const { buildTenantContext, normalizePhone } = require('./tenant-context');

async function resolveTenant(supabase, slug) {
  const safe = String(slug || process.env.DEFAULT_TENANT_SLUG || 'noun').trim().toLowerCase();
  const { data, error } = await supabase.from('tenants').select('id,slug,name,status').eq('slug', safe).eq('status','active').single();
  if (error || !data) throw new Error(`Active tenant not found: ${safe}`);
  return data;
}

async function resolveActor(supabase, tenantId, subjectId) {
  if (!subjectId) return null;
  const { data, error } = await supabase.from('tenant_memberships').select('subject_id,role,status').eq('tenant_id', tenantId).eq('subject_id', subjectId).eq('status','active').maybeSingle();
  if (error) throw error;
  return data ? { subjectId: data.subject_id, role: data.role } : null;
}

async function resolveWhatsAppActor(supabase, tenant, phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('Missing phone');
  const { data, error } = await supabase.from('students').select('phone,tenant_id').eq('tenant_id', tenant.id).eq('phone', normalized).maybeSingle();
  if (error) throw error;
  if (!data) return { subjectId: `wa:${normalized}`, role: 'student', known: false };
  return { subjectId: `wa:${normalized}`, role: 'student', known: true };
}

async function getTenantContext(supabase, { slug, subjectId = null, phone = null, source = 'server' } = {}) {
  const tenant = await resolveTenant(supabase, slug);
  let actor = null;
  if (subjectId) actor = await resolveActor(supabase, tenant.id, subjectId);
  if (!actor && phone) actor = await resolveWhatsAppActor(supabase, tenant, phone);
  return buildTenantContext({ tenant, actor, source });
}

module.exports = { resolveTenant, resolveActor, resolveWhatsAppActor, getTenantContext };
