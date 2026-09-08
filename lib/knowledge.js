const { createClient } = require('@supabase/supabase-js');
const { fetchLiveSources } = require('./live-sources');
function normalizeSupabaseUrl(value){const raw=String(value||'').trim().replace(/^['"]|['"]$/g,'').replace(/\/$/,'');if(!raw) throw new Error('SUPABASE_URL missing');const url=new URL(raw);return url.origin;}
const db=createClient(normalizeSupabaseUrl(process.env.SUPABASE_URL),process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const TIER_NAMES={1:'official_noun',2:'official_courseware',3:'official_news',4:'student_or_verified_secondary',5:'external'};
let tenantIdPromise;async function tenantId(){if(!tenantIdPromise)tenantIdPromise=db.from('tenants').select('id').eq('slug',process.env.DEFAULT_TENANT_SLUG||'noun').eq('status','active').single().then(({data,error})=>{if(error||!data)throw error||new Error('Active tenant missing');return data.id;});return tenantIdPromise;}
function tokenize(t){return String(t||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function overlap(q,t){const a=[...new Set(tokenize(q))],b=new Set(tokenize(t));return a.length?a.filter(x=>b.has(x)).length/a.length:0}
function freshness(d){if(!d)return .5;const days=(Date.now()-new Date(d).getTime())/86400000;if(days<7)return 1;if(days<30)return .9;if(days<180)return .75;if(days<365)return .6;return .35}
function rank(x,q){const tier=x.authority_tier||x.source_tier||4;return overlap(q,`${x.title||''} ${x.claim||''} ${x.summary||''} ${x.content||''} ${x.course_code||''} ${x.question_text||''} ${x.question||''}`)*.55+((6-tier)/5)*.25+freshness(x.verified_at||x.retrieved_at)*.2}
async function safe(table,select,filters=[]){const tid=await tenantId();let q=db.from(table).select(select).eq('tenant_id',tid);for(const f of filters)q=q[f[0]](f[1],f[2]);return q.limit(500)}
async function searchKnowledge(query,opts={}){
 const q=String(query||'').trim();if(!q)return{facts:[],live_facts:[],sources:[],confidence:'low'};
 const results=await Promise.all([
  safe('knowledge_claims','*',[['eq','status','active']]),safe('noun_policies','*',[['in','status',['active','stale']]]),safe('courses','*',[['eq','active',true]]),safe('programmes','*',[['eq','active',true]]),safe('academic_events','*',[['in','status',['verified','supplementary']]]),safe('assessments','*',[['in','verification_status',['official','verified_secondary']]]),safe('past_questions','*',[['in','verification_status',['official','verified_secondary','original','approved']]]),safe('knowledge_sources','*',[['eq','status','active']])
 ]);
 const kinds=['claim','policy','course','programme','event','assessment','past_question','source'];const facts=[];
 for(const [i,r] of results.entries())for(const x of r.data||[]){const kind=kinds[i];facts.push({...x,kind,score:rank(x,q)})}
 let live={facts:[],sources:[],confidence:'low'};
 if(opts.live!==false){try{const registered=(results[7]?.data||[]).filter(x=>x.source_url||x.url);live=await fetchLiveSources(q,{limit:opts.liveLimit||5,paths:opts.livePaths,sources:registered});}catch(_) {}}
 const liveFacts=(live.facts||[]).map(x=>({...x,kind:'live',score:rank(x,q)+.08}));facts.push(...liveFacts);facts.sort((a,b)=>b.score-a.score);
 const top=facts.slice(0,opts.limit||10);const liveTop=top.filter(x=>x.kind==='live');
 const sourceRows=[...top.map(x=>({tier:x.authority_tier||x.source_tier||4,title:x.title||x.claim||x.question_text||x.question||x.name,url:x.source_url||x.url||null,kind:x.kind,verification_status:x.verification_status||null})),...(live.sources||[])];
 const sources=sourceRows.filter((x,i,a)=>x.url?i===a.findIndex(y=>y.url===x.url):i===a.findIndex(y=>y.title===x.title));
 return{facts:top,live_facts:liveTop,sources,confidence:top.some(x=>x.score>.62)?'high':top.length?'medium':'low'};
}
function buildGrounding(r){return(r.facts||[]).map(x=>`[Tier ${x.authority_tier||x.source_tier||4} ${TIER_NAMES[x.authority_tier||x.source_tier||4]||x.source_type||'live_source'}${x.verification_status?` ${x.verification_status}`:''}] ${x.title||x.claim||x.question_text||x.question||x.name||''}${x.summary?` — ${x.summary}`:''}${x.content?` — ${String(x.content).slice(0,1800)}`:''}${x.source_url||x.url?` (${x.source_url||x.url})`:''}`).join('\n')}
function buildStudentGrounding({knowledge={facts:[],sources:[],confidence:'low'},courseContent=null}={}){const canonical=buildGrounding(knowledge);const text=[canonical,courseContent?`COURSE MATERIAL:\n${courseContent}`:''].filter(Boolean).join('\n\n');const sources=[...(knowledge.sources||[]),...(courseContent?[{tier:2,title:'Matched course content',url:null}]:[])];return{text,sources,confidence:knowledge.confidence||'low'};}
async function recordActivity(phone,event_type,course_code=null,topic=null,metadata={}){if(phone){const tid=await tenantId();await db.from('student_activity').insert({tenant_id:tid,phone,event_type,course_code,topic,metadata})}}
module.exports={db,searchKnowledge,buildGrounding,buildStudentGrounding,recordActivity,TIER_NAMES,tenantId};
