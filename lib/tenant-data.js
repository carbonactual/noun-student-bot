const { scopeQuery, assertTenantRow, canAccessRole } = require('./tenant-context');

function requireContext(ctx) {
  if (!ctx?.tenantId) throw new Error('Missing tenant context');
  return ctx;
}

function tenantSelect(supabase, table, columns = '*', ctx) {
  requireContext(ctx);
  return scopeQuery(supabase.from(table).select(columns), ctx);
}

function tenantCount(supabase, table, ctx) {
  requireContext(ctx);
  return scopeQuery(supabase.from(table).select('*', { count: 'exact', head: true }), ctx);
}

async function tenantInsert(supabase, table, row, ctx) {
  requireContext(ctx);
  const payload = { ...row, tenant_id: ctx.tenantId };
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return assertTenantRow(data, ctx);
}

async function tenantUpdate(supabase, table, idColumn, id, changes, ctx) {
  requireContext(ctx);
  const query = scopeQuery(supabase.from(table).update(changes).eq(idColumn, id), ctx);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return assertTenantRow(data, ctx);
}

async function tenantAudit(supabase, ctx, event) {
  requireContext(ctx);
  const { error } = await supabase.from('audit_events').insert({
    tenant_id: ctx.tenantId,
    actor_subject_id: ctx.actorSubjectId || null,
    actor_type: event.actorType || (ctx.actorRole === 'platform_operator' ? 'platform_operator' : 'system'),
    action: event.action,
    resource_type: event.resourceType || null,
    resource_id: event.resourceId == null ? null : String(event.resourceId),
    outcome: event.outcome || 'success',
    ip_hash: event.ipHash || null,
    metadata: event.metadata || {},
  });
  if (error) throw error;
}

function requireRole(ctx, roles) {
  if (!canAccessRole(ctx, roles)) throw new Error('Forbidden');
  return ctx;
}

module.exports = {
  tenantSelect,
  tenantCount,
  tenantInsert,
  tenantUpdate,
  tenantAudit,
  requireRole,
};
