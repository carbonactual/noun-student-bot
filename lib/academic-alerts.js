const {db}=require('./knowledge');

function daysUntil(iso){return Math.ceil((new Date(iso)-Date.now())/86400000)}
function sameCourse(a,b){return String(a||'').trim().toUpperCase()===String(b||'').trim().toUpperCase()}

async function planForStudent(phone){
  const {data:s,error:se}=await db.from('students').select('phone,level,courses,whatsapp_opt_in').eq('phone',phone).maybeSingle();
  if(se)throw se;
  if(!s||!s.whatsapp_opt_in)return {phone,alerts:[]};
  const courses=s.courses||[];
  const {data:events,error}=await db.from('academic_events').select('id,event_type,title,start_at,end_at,level,course_code,authority_tier,confidence,status').eq('status','verified').gte('start_at',new Date().toISOString()).order('start_at').limit(100);
  if(error)throw error;
  const relevant=(events||[]).filter(e=>(!e.level||String(e.level).toLowerCase()===String(s.level||'').toLowerCase()) && (!e.course_code||courses.some(c=>sameCourse(c,e.course_code))));
  const alerts=[];
  for(const e of relevant){const d=daysUntil(e.start_at); if(d<0||d>30)continue; const windows=[14,7,3,1]; const matched=windows.find(w=>d===w); if(!matched)continue; alerts.push({event_id:e.id,days_until:d,priority:d<=1?'urgent':d<=3?'high':'normal',title:e.title,course_code:e.course_code,event_type:e.event_type,start_at:e.start_at,authority_tier:e.authority_tier,confidence:e.confidence,message:`NOUN reminder: ${e.title}${e.course_code?` (${e.course_code})`:''} is in ${d} day${d===1?'':'s'}.`});}
  return {phone,alerts};
}
module.exports={planForStudent};
