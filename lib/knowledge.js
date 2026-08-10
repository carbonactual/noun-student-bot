const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const TIER_NAMES={1:'official_noun',2:'official_courseware',3:'official_news',4:'student_or_verified_secondary',5:'external'};
function tokenize(t){return String(t||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function overlap(q,t){const a=[...new Set(tokenize(q))],b=new Set(tokenize(t));return a.length?a.filter(x=>b.has(x)).length/a.length:0}
function freshness(d){if(!d)return .5;const days=(Date.now()-new Date(d).getTime())/86400000;if(days<7)return 1;if(days<30)return .9;if(days<180)return .75;if(days<365)return .6;return .35}
function rank(x,q){const tier=x.authority_tier||x.source_tier||4;return overlap(q,`${x.title||''} ${x.claim||''} ${x.summary||''} ${x.content||''} ${x.course_code||''} ${x.question_text||''}`)*.55+((6-tier)/5)*.25+freshness(x.verified_at||x.retrieved_at)*.2}
async function safe(table,select,filters=[]){let q=db.from(table).select(select);for(const f of filters)q=q[f[0]](f[1],f[2]);return q.limit(500)}
async function searchKnowledge(query,opts={}){const q=String(query||'').trim();if(!q)return {facts:[],sources:[],confidence:'low'};const results=await Promise.all([
 safe('knowledge_claims','*',[['eq','status','active']]),safe('noun_policies','*',[['in','status',['active','stale']]]),safe('courses','*',[['eq','active',true]]),safe('programmes','*',[['eq','active',true]]),safe('academic_events','*',[['in','status',['verified','supplementary']]]),safe('assessments','*',[['in','verification_status',['official','verified_secondary']]]),safe('knowledge_sources','*',[['eq','status','active']])
]);
const kinds=['claim','policy','course','programme','event','assessment','source'];const facts=[];for(const [i,r] of results.entries())for(const x of r.data||[]){const kind=kinds[i];facts.push({...x,kind,score:rank(x,q)})}facts.sort((a,b)=>b.score-a.score);const top=facts.slice(0,opts.limit||10);return {facts:top,sources:top.map(x=>({tier:x.authority_tier||x.source_tier||x.authority_tier||4,title:x.title||x.claim||x.question_text||x.name,url:x.source_url||x.source_url||x.url||null})),confidence:top.some(x=>x.score>.62)?'high':top.length?'medium':'low'}}
function buildGrounding(r){return(r.facts||[]).map(x=>`[Tier ${x.authority_tier||x.source_tier||4} ${TIER_NAMES[x.authority_tier||x.source_tier||4]}] ${x.title||x.claim||x.question_text||x.name||''}${x.summary?` — ${x.summary}`:''}${x.source_url||x.url?` (${x.source_url||x.url})`:''}`).join('\n')}
async function recordActivity(phone,event_type,course_code=null,topic=null,metadata={}){if(phone)await db.from('student_activity').insert({phone,event_type,course_code,topic,metadata})}
module.exports={db,searchKnowledge,buildGrounding,recordActivity,TIER_NAMES};
