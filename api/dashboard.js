const { db, tenantId } = require('../lib/knowledge');
const { buildOnboardingState, normalizeStudentContext } = require('../lib/student-onboarding-context');
const { buildStudentIntelligence } = require('../lib/student-intelligence');
const { buildExamReadiness } = require('../lib/exam-readiness');
const { buildSupportCase } = require('../lib/support-escalation');
const { bearer, createUser, signIn, getUser, refreshSession, recover, updatePassword, logout } = require('../lib/auth');

function clean(value, max = 500) { return String(value || '').trim().slice(0, max); }
function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}
// Public site backend: onboarding + student context are browser-facing by design; no shared-secret gate.

function productFrom(body, req) {
  const raw=String(body?.product || req.query?.product || 'noun').toLowerCase();
  return raw==='cibn' ? 'cibn' : 'noun';
}
function normalizeName(v){ return clean(v,120).replace(/\\s+/g,' ').trim(); }
function authPublic(origin){
  const allowed=[
    'https://noun.carbonactual.com',
    'https://noun-student-bot-dashboard.vercel.app',
    'https://mcp-bot-eight.vercel.app',
    'https://mcp-bot.vercel.app'
  ];
  return origin && allowed.includes(origin) ? origin : allowed[0];
}
function authRedirect(product){
  return product==='cibn'
    ? 'https://mcp-bot-eight.vercel.app/auth/?mode=reset'
    : 'https://noun.carbonactual.com/auth/?mode=reset';
}
async function safeAppAccount(tid, user, fields){
  try {
    const row={
      auth_user_id:user.id, product:fields.product, full_name:fields.full_name,
      email:fields.email, phone:fields.phone,
      matric_number:fields.matric_number||null, school_email:fields.school_email||null,
      updated_at:new Date().toISOString()
    };
    const result=await db.from('app_accounts').upsert(row,{onConflict:'auth_user_id,product'}).select('*').single();
    if(result.error) throw result.error;
    return result.data;
  } catch (_) {
    return null;
  }
}
async function authRoute(req,res,tenant){
  const body=req.body||{};
  const product=productFrom(body,req);
  try {
    if(req.method==='OPTIONS'){
      res.setHeader('Access-Control-Allow-Origin',authPublic(req.headers?.origin));
      res.setHeader('Vary','Origin');
      res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
      return res.status(204).end();
    }
    res.setHeader('Access-Control-Allow-Origin',authPublic(req.headers?.origin));
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Credentials','false');

    const route=String(req.query?.route||'');
    if(route==='auth-signup'){
      const full_name=normalizeName(body.full_name);
      const email=clean(body.email,180).toLowerCase();
      const phone=normalizePhone(body.phone);
      const password=String(body.password||'');
      const matric_number=clean(body.matric_number,80).toUpperCase();
      const school_email=clean(body.school_email,180).toLowerCase();
      if(!full_name||!email||!phone||password.length<8) return res.status(400).json({ok:false,error:'Full name, email, phone and an 8+ character password are required.'});
      if(product==='noun' && (!matric_number||!school_email)) return res.status(400).json({ok:false,error:'NOUN signup also requires matric number and school email.'});
      const metadata={product,full_name,phone};
      if(product==='noun') Object.assign(metadata,{matric_number,school_email});
      let created;
      try {
        created=await createUser({email,password,phone:'+'+phone,metadata});
      } catch(error){
        if(error.status===422||error.status===400) return res.status(409).json({ok:false,error:'That email or phone is already registered, or could not be accepted.'});
        throw error;
      }
      const user=created.user||created;
      if(product==='noun'){
        try{
          const existing=await db.from('students').select('phone,auth_user_id').eq('tenant_id',tenant).eq('phone',phone).maybeSingle();
          if(existing.data && existing.data.auth_user_id && existing.data.auth_user_id!==user.id){
            return res.status(409).json({ok:false,error:'That phone number is already linked to another NOUN account.'});
          }
          const payload={
            tenant_id:tenant,phone,full_name,email,school_email,matric_number,
            updated_at:new Date().toISOString(), onboarding_source:'account',
            whatsapp_opt_in:true,last_seen_at:new Date().toISOString(),auth_user_id:user.id
          };
          const saved=existing.data
            ? await db.from('students').update(payload).eq('tenant_id',tenant).eq('phone',phone)
            : await db.from('students').insert(payload);
          if(saved.error) throw saved.error;
        }catch(profileError){ console.error('noun account profile:',profileError.message); }
      }
      await safeAppAccount(tenant,user,{product,full_name,email,phone,matric_number,school_email});
      const session=await signIn(email,password);
      return res.status(201).json({ok:true,product,user:{id:user.id,full_name,email,phone,matric_number,school_email},session:{
        access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,expires_at:session.expires_at
      }});
    }

    if(route==='auth-login'){
      const email=clean(body.email,180).toLowerCase();
      const password=String(body.password||'');
      if(!email||!password) return res.status(400).json({ok:false,error:'Email and password are required.'});
      const session=await signIn(email,password);
      const user=await getUser(session.access_token);
      const metadata=user.user_metadata||{};
      const userProduct=metadata.product||product;
      if(product && userProduct && userProduct!==product) return res.status(403).json({ok:false,error:'This account belongs to another service.'});
      await safeAppAccount(tenant,user,{product,full_name:normalizeName(metadata.full_name||metadata.name||user.email),email:user.email||email,phone:normalizePhone(metadata.phone),matric_number:metadata.matric_number,school_email:metadata.school_email});
      return res.status(200).json({ok:true,product,user:{id:user.id,full_name:metadata.full_name||metadata.name||'',email:user.email||email,phone:normalizePhone(metadata.phone),matric_number:metadata.matric_number||'',school_email:metadata.school_email||''},session:{
        access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,expires_at:session.expires_at
      }});
    }

    if(route==='auth-recover'){
      const email=clean(body.email,180).toLowerCase();
      if(!email) return res.status(400).json({ok:false,error:'Email is required.'});
      await recover(email,authRedirect(product));
      return res.status(200).json({ok:true,message:'If an account matches that email, a recovery link is on its way.'});
    }

    if(route==='auth-refresh'){
      const refreshToken=String(body.refresh_token||'');
      if(!refreshToken) return res.status(400).json({ok:false,error:'Refresh token required.'});
      const session=await refreshSession(refreshToken);
      return res.status(200).json({ok:true,session:{
        access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,expires_at:session.expires_at
      }});
    }

    if(route==='auth-reset'){
      const accessToken=bearer(req)||String(body.access_token||'');
      const password=String(body.password||'');
      if(!accessToken||password.length<8) return res.status(400).json({ok:false,error:'A valid recovery session and an 8+ character password are required.'});
      await updatePassword(accessToken,password);
      return res.status(200).json({ok:true,message:'Password updated successfully. You can sign in now.'});
    }

    if(route==='auth-me'){
      const accessToken=bearer(req)||String(body.access_token||'');
      const user=await getUser(accessToken);
      const metadata=user.user_metadata||{};
      const selected=productFrom({product:metadata.product||product},req);
      let student=null;
      if(selected==='noun' && metadata.phone){
        try{
          const lookup=await db.from('students').select('*').eq('tenant_id',tenant).eq('phone',normalizePhone(metadata.phone)).maybeSingle();
          student=lookup.data||null;
        }catch(_){}
      }
      return res.status(200).json({ok:true,product:selected,user:{
        id:user.id,full_name:metadata.full_name||metadata.name||'',email:user.email||'',
        phone:normalizePhone(metadata.phone),matric_number:metadata.matric_number||'',school_email:metadata.school_email||''
      },student});
    }

    if(route==='auth-logout'){
      const accessToken=bearer(req)||String(body.access_token||'');
      if(accessToken){try{await logout(accessToken);}catch(_){}}
      return res.status(200).json({ok:true});
    }

    return res.status(404).json({ok:false,error:'Unknown auth route'});
  } catch(error){
    console.error('auth:',error.message);
    const status=error.status===401?401:error.status===422?422:503;
    return res.status(status).json({ok:false,error:'Authentication service is unavailable or the details could not be accepted.'});
  }
}

function isSchemaDrift(error, column) {
  const message = String(error?.message || '').toLowerCase();
  return Boolean(
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    (column && message.includes(column.toLowerCase()) && message.includes('schema cache'))
  );
}

async function authenticatedActor(req) {
  const accessToken = bearer(req);
  if (!accessToken) return null;
  const user = await getUser(accessToken);
  const metadata = user.user_metadata || {};
  return {
    user,
    phone: normalizePhone(metadata.phone),
    product: metadata.product || null
  };
}

async function requireActorForPhone(req, requestedPhone, { allowAdmin = false, tenant = null } = {}) {
  const actor = await authenticatedActor(req);
  if (!actor) {
    const error = new Error('Sign in required');
    error.status = 401;
    throw error;
  }
  const requested = normalizePhone(requestedPhone);
  if (requested && actor.phone && requested !== actor.phone) {
    const error = new Error('Student account mismatch');
    error.status = 403;
    throw error;
  }
  if (allowAdmin && tenant) {
    const { data: membership, error } = await db.from('tenant_memberships')
      .select('role,status')
      .eq('tenant_id', tenant)
      .eq('subject_id', actor.user.id)
      .eq('status', 'active')
      .in('role', ['support','department_admin','faculty_admin','institution_admin','platform_operator'])
      .maybeSingle();
    if (error) throw error;
    if (!membership) {
      const error = new Error('Tenant administrator access required');
      error.status = 403;
      throw error;
    }
  }
  return actor;
}

async function onboard(req, res, tenant) {
  const body = req.body || {};
  const full_name = clean(body.full_name, 120), email = clean(body.email, 180).toLowerCase();
  const phone = normalizePhone(body.phone), study_level = clean(body.study_level, 40) || 'undergraduate';
  const programme_title = clean(body.programme_title, 180), level = clean(body.level, 80), help_need = clean(body.help_need, 800);
  if (!full_name || !email || !phone || !programme_title) return res.status(400).json({ error: 'full_name, email, phone, programme_title and study_level are required' });
  const now = new Date().toISOString();
  const payload = { tenant_id: tenant, phone, full_name, email, study_level, programme_title, level: level || null, updated_at: now, onboarding_source: 'web', whatsapp_opt_in: true, last_seen_at: now };
  const actor = await authenticatedActor(req);
  if (actor?.phone && actor.phone !== phone) {
    return res.status(403).json({ error: 'Student account mismatch' });
  }
  const { data: existing, error: lookupError } = await db.from('students').select('phone,auth_user_id').eq('tenant_id', tenant).eq('phone', phone).maybeSingle();
  if (lookupError) throw lookupError;

  if (existing && !actor) {
    return res.status(409).json({ error: 'That student profile already exists. Sign in to continue.' });
  }
  if (existing?.auth_user_id && (!actor || existing.auth_user_id !== actor.user.id)) {
    return res.status(409).json({ error: 'That phone number is already linked to another NOUN account.' });
  }
  if (actor?.user?.id) payload.auth_user_id = actor.user.id;

  let result = existing
    ? await db.from('students').update(payload).eq('tenant_id', tenant).eq('phone', phone).select('*').single()
    : await db.from('students').insert(payload).select('*').single();

  if (result.error && isSchemaDrift(result.error, 'study_level')) {
    const legacyPayload = { ...payload };
    delete legacyPayload.study_level;
    result = existing
      ? await db.from('students').update(legacyPayload).eq('tenant_id', tenant).eq('phone', phone).select('*').single()
      : await db.from('students').insert(legacyPayload).select('*').single();
  }
  if (result.error) throw result.error;

  await db.from('student_activity').insert({
    tenant_id: tenant,
    phone,
    event_type: 'web_onboarding',
    topic: help_need || 'joined NOUN BOT',
    metadata: { source: 'web', help_need, schema_mode: result.data?.study_level ? 'canonical' : 'legacy' }
  });

  return res.status(200).json({ ok: true, student: result.data, message: 'Your NOUN BOT profile is ready.' });
}

async function studentContext(req, res, tenant) {
  const requested = normalizePhone(req.query?.phone || req.body?.phone);
  const actor = await requireActorForPhone(req, requested, { tenant });
  const phone = actor.phone || requested;
  if (!phone) return res.status(400).json({ error: 'Account phone is missing' });
  const { data: student, error } = await db.from('students').select('*').eq('tenant_id', tenant).eq('phone', phone).maybeSingle();
  if (error) throw error;
  if (!student) return res.status(404).json({ ok: false, error: 'Student profile not found' });
  if (req.method === 'POST') {
    const incoming = normalizeStudentContext(req.body || {}), patch = { ...incoming, updated_at: new Date().toISOString(), onboarding_source: 'noun-bot' };
    delete patch.full_name;
    let updated = await db.from('students').update(patch).eq('tenant_id', tenant).eq('phone', phone).select('*').single();
    if (updated.error && isSchemaDrift(updated.error, 'study_level')) {
      const legacyPatch = { ...patch };
      delete legacyPatch.study_level;
      updated = await db.from('students').update(legacyPatch).eq('tenant_id', tenant).eq('phone', phone).select('*').single();
    }
    if (updated.error) throw updated.error;
    const context = normalizeStudentContext(updated.data);
    return res.status(200).json({ ok: true, context, onboarding: buildOnboardingState(context) });
  }
  const context = normalizeStudentContext(student);
  return res.status(200).json({ ok: true, context, onboarding: buildOnboardingState(context) });
}

async function examReadiness(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const actor = await requireActorForPhone(req, req.query?.phone, { tenant: await tenantId() });
  const phone = actor.phone || normalizePhone(req.query?.phone);
  if (!phone) return res.status(400).json({ error: 'Account phone is missing' });
  const tid = await tenantId();
  const intelligence = await buildStudentIntelligence(phone);
  const examResult = await db.from('exams').select('*').eq('tenant_id', tid).limit(500);
  const practiceResult = await db.from('practice_attempts').select('*').eq('tenant_id', tid).limit(500);
  if (examResult.error) throw examResult.error;
  if (practiceResult.error) throw practiceResult.error;
  const courses = intelligence.course_workspace.map(x => x.course_code).filter(Boolean);
  const readiness = buildExamReadiness({ courses, exams: examResult.data || [], practice: practiceResult.data || [] });
  return res.status(200).json({ ok: true, readiness, source_state: { courses: courses.length, exams: (examResult.data || []).length, practice_attempts: (practiceResult.data || []).length } });
}

async function supportCase(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const tid = await tenantId();
  const actor = await requireActorForPhone(req, req.body?.phone, { tenant: tid });
  const c = buildSupportCase({ ...(req.body || {}), phone: actor.phone });
  if (!c.student_phone || !c.description) return res.status(400).json({ error: 'phone and description required' });
  const result = await db.from('student_support_cases').insert({ tenant_id: tid, ...c }).select('id,student_phone,category,description,course_code,urgency,status,created_at').single();
  if (result.error) throw result.error;
  return res.status(201).json({ ok: true, case: result.data, message: 'Your request has been recorded for human follow-up.' });
}

module.exports = async function handler(req, res) {
  try {
    if (req.query?.health === '1') {
      res.setHeader('Content-Type','application/json');
      return res.status(200).json({
        ok: true,
        status: 'ok',
        name: 'ABBA Being Agent',
        service: 'noun-student-bot',
        timestamp: new Date().toISOString()
      });
    }
    const route = String(req.query?.route || '').toLowerCase();
    const tenant = await tenantId();
    if (route === 'student-context') return studentContext(req, res, tenant);
    if (route === 'exam-readiness') return examReadiness(req, res);
    if (route === 'support-case') return supportCase(req, res);
    if (route.startsWith('auth-')) return authRoute(req, res, tenant);
    if (req.method === 'POST') return onboard(req, res, tenant);
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET or POST only' });
    await requireActorForPhone(req, null, { allowAdmin: true, tenant });
    const today = new Date().toISOString().slice(0, 10);
    const [{ count: students }, { count: active_students }, { count: checklists }, { count: open_help }, { count: upcoming_deadlines }, { count: study_questions }, { count: study_answered }, { count: study_fallback }, { count: human_help_requests }, levels, courses, deadlines, campaigns] = await Promise.all([
      db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant), db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('stage', 'active'),
      db.from('exam_checklists').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant), db.from('help_requests').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).in('status', ['open', 'pending']),
      db.from('deadlines').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).gte('due_date', today), db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_question'),
      db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_answered'), db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_fallback'),
      db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'human_support_requested'), db.from('students').select('level').eq('tenant_id', tenant).limit(5000),
      db.from('students').select('courses').eq('tenant_id', tenant).limit(5000), db.from('deadlines').select('level,course,title,due_date').eq('tenant_id', tenant).gte('due_date', today).order('due_date').limit(30), db.from('campaigns').select('name,status,created_at').eq('tenant_id', tenant).order('created_at', { ascending: false }).limit(30)
    ]);
    for (const result of [levels, courses, deadlines, campaigns]) if (result.error) throw result.error;
    const by_level = {}, by_course = {};
    for (const row of levels.data || []) if (row.level) by_level[row.level] = (by_level[row.level] || 0) + 1;
    for (const row of courses.data || []) for (const course of row.courses || []) by_course[course] = (by_course[course] || 0) + 1;
    return res.status(200).json({ stats: { students: students || 0, active_students: active_students || 0, upcoming_deadlines: upcoming_deadlines || 0, checklists: checklists || 0, open_help: open_help || 0 }, intelligence: { study_questions: study_questions || 0, study_answered: study_answered || 0, study_fallback: study_fallback || 0, human_help_requests: human_help_requests || 0 }, by_level, by_course, deadlines: deadlines.data || [], campaigns: campaigns.data || [], generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('dashboard:', error.message);
    return res.status(503).json({ ok: false, error: 'Dashboard data source unavailable' });
  }
};
