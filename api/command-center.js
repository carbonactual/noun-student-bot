const { createClient } = require('@supabase/supabase-js');
const { bearer, getUser } = require('../lib/auth');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function tenant() {
  const { data, error } = await db
    .from('tenants')
    .select('id')
    .eq('slug', process.env.DEFAULT_TENANT_SLUG || 'noun')
    .eq('status', 'active')
    .single();
  if (error) throw error;
  return data;
}

async function requireTenantAdmin(req) {
  const token = bearer(req);
  if (!token) {
    const error = new Error('Sign in required');
    error.status = 401;
    throw error;
  }

  const user = await getUser(token);
  const t = await tenant();
  const { data: membership, error } = await db
    .from('tenant_memberships')
    .select('role,status')
    .eq('tenant_id', t.id)
    .eq('subject_id', user.id)
    .eq('status', 'active')
    .in('role', [
      'support',
      'department_admin',
      'faculty_admin',
      'institution_admin',
      'platform_operator'
    ])
    .maybeSingle();

  if (error) throw error;
  if (!membership) {
    const error = new Error('Tenant administrator access required');
    error.status = 403;
    throw error;
  }

  return t;
}

async function countRows(table, filters = []) {
  let query = db.from(table).select('*', { count: 'exact', head: true });
  for (const filter of filters) {
    if (filter.op === 'gte') query = query.gte(filter.column, filter.value);
    else if (filter.op === 'lte') query = query.lte(filter.column, filter.value);
    else if (filter.op === 'in') query = query.in(filter.column, filter.value);
    else query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const t = await requireTenantAdmin(req);
    const now = new Date();
    const iso = now.toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [
      students,
      deadlines,
      help,
      events,
      services,
      insights,
      campaigns,
      signals,
      runs,
      changes
    ] = await Promise.all([
      countRows('students', [{ column: 'tenant_id', value: t.id }]),
      countRows('deadlines', [{ column: 'tenant_id', value: t.id }]),
      countRows('help_requests', [
        { column: 'tenant_id', value: t.id },
        { column: 'created_at', value: d7, op: 'gte' }
      ]),
      countRows('academic_events', [
        { column: 'tenant_id', value: t.id },
        { column: 'status', value: 'verified' }
      ]),
      countRows('student_services', [
        { column: 'tenant_id', value: t.id },
        { column: 'verification_status', value: 'verified' }
      ]),
      countRows('intelligence_signals', [{ column: 'tenant_id', value: t.id }]),
      countRows('campaigns', [{ column: 'tenant_id', value: t.id }]),
      countRows('intelligence_runs', [{ column: 'tenant_id', value: t.id }]),
      countRows('intelligence_changes', [{ column: 'tenant_id', value: t.id }]),
      countRows('source_snapshots', [{ column: 'tenant_id', value: t.id }])
    ]);

    const [
      failedSources,
      openHelp,
      upcoming,
      serviceDemand,
      recentChanges
    ] = await Promise.all([
      db.from('intelligence_runs')
        .select('id,source_id,status,error_message,started_at')
        .eq('tenant_id', t.id)
        .eq('status', 'failed')
        .order('started_at', { ascending: false })
        .limit(20),
      db.from('help_requests')
        .select('id,phone,level,note,created_at')
        .eq('tenant_id', t.id)
        .order('created_at', { ascending: false })
        .limit(20),
      db.from('academic_events')
        .select('id,event_type,title,start_at,level,course_code,authority_tier,confidence')
        .eq('tenant_id', t.id)
        .eq('status', 'verified')
        .gte('start_at', iso)
        .order('start_at')
        .limit(20),
      db.from('intelligence_signals')
        .select('category,query,course,level,created_at')
        .eq('tenant_id', t.id)
        .eq('signal_type', 'service_demand')
        .gte('created_at', d7)
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('intelligence_changes')
        .select('id,source_id,change_type,detected_at,validation_status')
        .eq('tenant_id', t.id)
        .order('detected_at', { ascending: false })
        .limit(20)
    ]);

    for (const result of [failedSources, openHelp, upcoming, serviceDemand, recentChanges]) {
      if (result.error) throw result.error;
    }

    const verifiedEvents = upcoming.data?.length || 0;
    const failedSourceCount = failedSources.data?.length || 0;
    const sourceHealth = Math.max(0, Math.round(100 - failedSourceCount * 5));
    const changeCount = recentChanges.data?.length || 0;
    const dataHealth = Math.min(
      100,
      Math.round((verifiedEvents / Math.max(1, verifiedEvents + changeCount)) * 100)
    );

    return res.status(200).json({
      ok: true,
      generated_at: iso,
      health: {
        overall: Math.round((sourceHealth + dataHealth) / 2),
        source: sourceHealth,
        data: dataHealth
      },
      kpis: {
        students,
        deadlines,
        verified_academic_events: events,
        verified_services: services,
        service_demand_7d: serviceDemand.data?.length || 0,
        insights,
        campaigns,
        help_requests: help,
        runs,
        changes
      },
      queues: {
        failed_sources: failedSources.data || [],
        help_requests: openHelp.data || []
      },
      upcoming: upcoming.data || [],
      recent_changes: recentChanges.data || [],
      service_demand: serviceDemand.data || [],
      architecture: {
        system_of_record: 'Supabase',
        serverless_backend: 'Vercel',
        interface: 'WhatsApp',
        orchestrator: 'ABBA',
        automation: 'Zapier',
        ai: 'Gemini',
        source_authority: 'NOUN-first'
      }
    });
  } catch (e) {
    console.error(e);
    const status = e.status === 401 ? 401 : e.status === 403 ? 403 : 500;
    return res.status(status).json({
      error: status === 401 ? 'Sign in required'
        : status === 403 ? 'Tenant administrator access required'
        : 'Command center aggregation failed'
    });
  }
};
