const NOUN_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'noun';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function requireInternalTenantSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) {
    throw new Error('Invalid tenant slug');
  }
  return slug;
}

function buildTenantContext({ tenant, actor = null, source = 'server' }) {
  if (!tenant?.id || !tenant?.slug) throw new Error('Tenant context requires an id and slug');
  return Object.freeze({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    actorSubjectId: actor?.subjectId || null,
    actorRole: actor?.role || null,
    source,
  });
}

function assertTenantRow(row, ctx) {
  if (!row || !ctx?.tenantId || row.tenant_id !== ctx.tenantId) {
    throw new Error('Tenant boundary violation');
  }
  return row;
}

function scopeQuery(query, ctx) {
  if (!ctx?.tenantId) throw new Error('Missing tenant context');
  return query.eq('tenant_id', ctx.tenantId);
}

function canAccessRole(ctx, roles) {
  return Boolean(ctx?.actorRole && roles.includes(ctx.actorRole));
}

module.exports = {
  NOUN_TENANT_SLUG,
  normalizePhone,
  requireInternalTenantSlug,
  buildTenantContext,
  assertTenantRow,
  scopeQuery,
  canAccessRole,
};
