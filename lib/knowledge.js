const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false } });

const TIER_NAMES = {1:'official_noun',2:'official_courseware',3:'official_news',4:'student_or_verified_secondary',5:'external'};

function tokenize(text){return String(text||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function overlap(query,text){const q=[...new Set(tokenize(query))]; const h=new Set(tokenize(text)); return q.length ? q.filter(x=>h.has(x)).length/q.length : 0;}
function freshness(date){if(!date)return 0.5; const days=(Date.now()-new Date(date).getTime())/86400000; if(days<7)return 1; if(days<30)return .9; if(days<180)return .75; if(days<365)return .6; return .35;}
function rank(item, query){const source=(item.authority_tier||item.source_tier||4); const authority=(6-source)/5; return overlap(query,`${item.title||''} ${item.claim||''} ${item.summary||''} ${item.content||''}`)*.55+authority*.25+freshness(item.verified_at||item.retrieved_at)*.2;}

async function searchKnowledge(query, opts={}){
  const q=String(query||'').trim(); if(!q)return {facts:[],sources:[],confidence:'low'};
  const [claims,policies,courses,programmes,events]=await Promise.all([
    db.from('knowledge_claims').select('id,claim,claim_type,subject_type,subject_id,authority_tier,confidence,verified_at,status,source_id').eq('status','active').limit(200),
    db.from('noun_policies').select('id,title,policy_code,policy_area,source_url,authority_tier,effective_date,retrieved_at,status,summary').in('status',['active','stale']).limit(150),
    db.from('courses').select('id,course_code,title,credit_units,source_url,source_tier,verification_status,verified_at').eq('active',true).limit(500),
    db.from('programmes').select('id,title,award_type,programme_level,programme_code,source_url,source_tier,verification_status,verified_at').eq('active',true).limit(500),
    db.from('academic_events').select('id,event_type,title,start_at,end_at,level,course_code,source_id,authority_tier,confidence,status').in('status',['verified','supplementary']).limit(200)
  ]);
  const facts=[];
  for(const x of claims.data||[]) facts.push({...x,kind:'claim',score:rank(x,q)});
  for(const x of policies.data||[]) facts.push({...x,kind:'policy',score:rank(x,q)});
  for(const x of courses.data||[]) facts.push({...x,kind:'course',claim:`${x.course_code} ${x.title||''}`,authority_tier:x.source_tier,score:rank(x,q)});
  for(const x of programmes.data||[]) facts.push({...x,kind:'programme',claim:`${x.title} ${x.award_type||''}`,authority_tier:x.source_tier,score:rank(x,q)});
  for(const x of events.data||[]) facts.push({...x,kind:'event',claim:`${x.title} ${x.event_type} ${x.course_code||''}`,authority_tier:x.authority_tier,score:rank(x,q)});
  facts.sort((a,b)=>b.score-a.score);
  const top=facts.slice(0,opts.limit||8);
  const high=top.filter(x=>x.score>.62);
  return {facts:top,sources:top.map(x=>({tier:x.authority_tier||x.source_tier,title:x.title||x.claim,url:x.source_url||null})),confidence:high.length?'high':top.length?'medium':'low'};
}

function buildGrounding(result){return (result.facts||[]).map(x=>`[Tier ${x.authority_tier||x.source_tier||4} ${TIER_NAMES[x.authority_tier||x.source_tier||4]}] ${x.title||x.claim||''}${x.summary?` — ${x.summary}`:''}${x.source_url?` (${x.source_url})`:''}`).join('\n')}

async function recordActivity(phone,event_type,course_code=null,topic=null,metadata={}){
  if(!phone)return;
  await db.from('student_activity').insert({phone,event_type,course_code,topic,metadata});
}

module.exports={db,searchKnowledge,buildGrounding,recordActivity,TIER_NAMES};
