const {createClient}=require('@supabase/supabase-js');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const SECRET=process.env.DASHBOARD_SECRET||process.env.WEBHOOK_SECRET;
async function q(table,select,limit=100){try{const r=await db.from(table).select(select).order('created_at',{ascending:false}).limit(limit);return r.error?{rows:[],error:r.error.message}:{rows:r.data||[],error:null}}catch(e){return {rows:[],error:e.message}}}
function countBy(rows,key){return rows.reduce((a,x)=>{const k=x[key]||'unknown';a[k]=(a[k]||0)+1;return a},{})}
module.exports=async(req,res)=>{if(req.method!=='GET')return res.status(405).json({error:'GET only'});if(SECRET&&req.headers['x-dashboard-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});try{
 const [students,events,changes,services,signals,insights,campaigns,help,sources]=await Promise.all([
  q('students','level,faculty,department,stage,courses,created_at',5000),
  q('academic_events','id,event_type,title,course_code,level,start_at,authority_tier,confidence,status,created_at',200),
  q('intelligence_changes','id,source_url,change_type,title,authority_tier,confidence,status,detected_at,created_at',200),
  q('student_services','id,title,category,provider_name,price,currency,location,authority_tier,verification_status,last_verified_at,expires_at,created_at',200),
  q('intelligence_signals','id,signal_type,category,course,level,created_at',500),
  q('insights','id,title,summary,status,created_at',100),
  q('campaigns','id,name,status,created_at',100),
  q('help_requests','id,status,level,created_at',100),
  q('knowledge_sources','source_url,source_type,authority_tier,status,retrieved_at,created_at',200)
 ]);
 const activeStudents=students.rows.filter(x=>x.stage==='active');
 const verifiedServices=services.rows.filter(x=>x.verification_status==='verified');
 const now=Date.now();
 const upcoming=events.rows.filter(x=>x.status==='verified'&&x.start_at&&new Date(x.start_at).getTime()>=now);
 const openChanges=changes.rows.filter(x=>!['rejected','ignored'].includes(x.status));
 const portal={generated_at:new Date().toISOString(),product:'NOUN Student Intelligence',parent:'ABBA / Carbon Actual',health:{students:activeStudents.length,events_verified:events.rows.filter(x=>x.status==='verified').length,upcoming_events:upcoming.length,open_changes:openChanges.length,verified_services:verifiedServices.length,service_demands:signals.rows.filter(x=>x.signal_type==='service_demand').length,open_help:help.rows.filter(x=>x.status==='open').length},student_graph:{by_level:countBy(activeStudents,'level'),by_faculty:countBy(activeStudents,'faculty'),by_department:countBy(activeStudents,'department')},intelligence:{recent_changes:changes.rows.slice(0,30),signals_by_type:countBy(signals.rows,'signal_type'),signals_by_category:countBy(signals.rows,'category'),recent_insights:insights.rows.slice(0,20)},academic:{upcoming_events:upcoming.slice(0,50),events_by_type:countBy(events.rows,'event_type')},services:{verified:verifiedServices.slice(0,50),by_category:countBy(verifiedServices,'category')},operations:{campaigns:campaigns.rows.slice(0,30),help:help.rows.slice(0,30)},sources:{monitored:sources.rows.length,by_tier:countBy(sources.rows,'authority_tier'),recent:sources.rows.slice(0,50)}};
 return res.status(200).json(portal);
 }catch(e){console.error(e);return res.status(500).json({error:'Intelligence portal unavailable'})}};
