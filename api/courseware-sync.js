const crypto=require('crypto');
const {db,tenantId}=require('../lib/knowledge');
const { cleanPhone, getStudent } = require('../lib/student-intelligence');
const SECRET=process.env.WEBHOOK_SECRET;
function score(q,row){const tokens=String(q||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);const blob=JSON.stringify(row).toLowerCase();return tokens.reduce((n,t)=>n+(blob.includes(t)?1:0),0);}
const FACULTIES={
  Agricultural_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-agric/',
  Arts:'https://nou.edu.ng/ecourseware-faculty-of-arts/',
  Computing:'https://nou.edu.ng/ecourseware-faculty-of-computing-2/',
  Education:'https://nou.edu.ng/ecourseware-faculty-of-edu/',
  Health_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-health-sc/',
  Law:'https://nou.edu.ng/ecourseware-faculty-of-law/',
  Management_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-management-sc/',
  Sciences:'https://nou.edu.ng/ecourseware-faculty-of-sciences/',
  Social_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-social-sc/',
  DEAGS:'https://nou.edu.ng/ecourseware-degs/'
};
function clean(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()}
function rows(html){return [...String(html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(x=>clean(x[1]))).filter(r=>r.length>=4)}
function num(v){const m=String(v||'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):null}
module.exports=async(req,res)=>{if(req.method==='GET')return pastQuestionsHandler(req,res);
if(req.method!=='POST')return res.status(405).json({error:'POST only'});if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});try{const wanted=req.body?.faculty;const list=wanted?Object.entries(FACULTIES).filter(([k])=>k===wanted):Object.entries(FACULTIES);const audit=await db.from('sync_runs').insert({tenant_id:await tenantId(),sync_type:'courseware',source_url:wanted?FACULTIES[wanted]:null,status:'started'}).select('id').single();let total=0,errors=[],rejected=0;for(const [faculty,url] of list){try{const r=await fetch(url,{headers:{'user-agent':'NOUN-Student-Bot-Courseware-Sync/2.0'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const html=await r.text();const sourceHash=crypto.createHash('sha256').update(html).digest('hex');await db.from('source_documents').upsert({tenant_id:await tenantId(),source_url:url,source_type:'courseware_faculty',authority_tier:1,title:`NOUN eCourseware — ${faculty}`,content_hash:sourceHash,retrieved_at:new Date().toISOString(),http_status:r.status,parser_version:'courseware-sync-v2',status:'active'},{onConflict:'source_url'});const {data:f,error:fe}=await db.from('academic_faculties').upsert({tenant_id:await tenantId(),name:faculty,source_url:url,source_tier:1,verified_at:new Date().toISOString(),active:true},{onConflict:'name'}).select('id').single();if(fe)throw fe;for(const r of rows(html)){const code=(r[0]||'').replace(/\s+/g,'').toUpperCase();if(!/^[A-Z]{2,6}\d{3}$/.test(code))continue;const title=r[1]||null;if(!title)continue;const credit=num(r[2]);const level=(r[3]||'').match(/\d{3}/)?.[0]||null;const semester=num(r[4]);const {data:c,error:ce}=await db.from('courses').upsert({tenant_id:await tenantId(),course_code:code,title,credit_units:credit,source_url:url,source_tier:1,verification_status:'verified',verified_at:new Date().toISOString(),active:true},{onConflict:'course_code'}).select('id').single();if(ce){rejected++;continue}const {error:oe}=await db.from('course_offerings').upsert({tenant_id:await tenantId(),course_id:c.id,faculty_id:f.id,level,semester,credit_units:credit,source_url:url,source_tier:1,verified_at:new Date().toISOString()},{onConflict:'course_id,faculty_id,level,semester'});if(oe)rejected++;else total++}}catch(e){errors.push({faculty,error:e.message})}}if(audit.data?.id)await db.from('sync_runs').update({status:errors.length?'partial':'completed',records_seen:total+rejected,records_inserted:total,records_rejected:rejected,error_count:errors.length,details:{faculties:list.map(x=>x[0]),errors},completed_at:new Date().toISOString()}).eq('id',audit.data.id);return res.status(200).json({ok:true,faculties:list.map(x=>x[0]),course_rows_processed:total,rejected,errors});}catch(e){console.error(e);return res.status(500).json({error:'Courseware sync failed',detail:e.message})}}
async function pastQuestionsHandler(req,res){
  if(SECRET){ if(req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'}); }
 else return res.status(401).json({error:'Revision endpoint requires server authentication'});
 try{const tid=await tenantId();const phone=cleanPhone(req.query?.phone);const q=String(req.query?.q||'').slice(0,180);const course=String(req.query?.course||'').slice(0,80);const student=phone?await getStudent(phone):null;const courses=Array.isArray(student?.courses)?student.courses:[];
  const {data,error}=await db.from('past_questions').select('*').eq('tenant_id',tid).in('verification_status',['official','verified_secondary','original','approved']).limit(200);
  if(error)throw error;let rows=(data||[]).map(row=>({row,_score:score(`${q} ${course}`,row)+(courses.some(c=>JSON.stringify(row).toLowerCase().includes(String(c).toLowerCase()))?2:0)})).sort((a,b)=>b._score-a._score).slice(0,20).map(({row})=>row);
  return res.status(200).json({ok:true,revision_only:true,notice:'Past questions are provided for revision. They are not official examination papers unless explicitly verified as such.',questions:rows});
 }catch(e){console.error('past-questions:',e);return res.status(503).json({ok:false,error:'Past-question source unavailable'});

}
