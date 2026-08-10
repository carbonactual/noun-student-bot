const {db,searchKnowledge,buildGrounding}=require('./knowledge');

const EVENT_TYPES=new Set(['news','academic_change','policy_change','course_change','programme_change','student_impact','service_opportunity','internship','event','insight_candidate','campaign_candidate']);
const ACTIONS=new Set(['observe','inform','recommend','escalate','campaign_candidate']);

function classifyEvent(x={}){
  const s=`${x.title||''} ${x.summary||''} ${x.description||''}`.toLowerCase();
  if(/exam|timetable|tma|assessment|calendar/.test(s))return 'academic_change';
  if(/policy|regulation|rule/.test(s))return 'policy_change';
  if(/internship|siwes|scholarship|opportunity/.test(s))return /internship|siwes/.test(s)?'internship':'service_opportunity';
  if(/textbook|gown|id card|clearance|printing|transport|accommodation/.test(s))return 'service_opportunity';
  if(/programme|department|faculty|course/.test(s))return /programme|department|faculty/.test(s)?'programme_change':'course_change';
  if(/news|announce|event/.test(s))return 'news';
  return 'student_impact';
}

function decide({event_type,authority_tier=4,confidence=0,student_impact=false,source_verified=false}={}){
  if(!source_verified && authority_tier<=3) return {action:'observe',status:'needs_verification',reason:'Authoritative-looking source has not passed validation.'};
  if(confidence<0.65)return {action:'observe',status:'low_confidence',reason:'Confidence below communication threshold.'};
  if(student_impact)return {action:'recommend',status:'ready_for_student_matching',reason:'Validated information appears relevant to students.'};
  if(['policy_change','academic_change','course_change','programme_change'].includes(event_type))return {action:'recommend',status:'ready_for_review',reason:'Institutional change requires impact review before broadcast.'};
  return {action:'observe',status:'recorded',reason:'Recorded for intelligence; no automatic broadcast.'};
}

async function createEvent(input={}){
  const event_type=EVENT_TYPES.has(input.event_type)?input.event_type:classifyEvent(input);
  const decision=decide({...input,event_type});
  const payload={event_type,title:input.title||null,summary:input.summary||null,description:input.description||null,source_url:input.source_url||null,authority_tier:input.authority_tier||4,confidence:Number(input.confidence||0),status:decision.status,action:decision.action,metadata:{...(input.metadata||{}),decision_reason:decision.reason},created_at:new Date().toISOString()};
  const {data,error}=await db.from('abba_intelligence_events').insert(payload).select('*').single();
  if(error)throw error;return data;
}

async function studentBrief(phone,query){
  const {data:student,error}=await db.from('students').select('phone,name,level,courses,faculty,department,email').eq('phone',phone).maybeSingle();
  if(error)throw error;
  const knowledge=await searchKnowledge(`${query||''} ${student?.faculty||''} ${student?.department||''} ${(student?.courses||[]).join(' ')}`,{limit:12});
  return {student,knowledge,grounding:buildGrounding(knowledge)};
}

module.exports={EVENT_TYPES,ACTIONS,classifyEvent,decide,createEvent,studentBrief};
