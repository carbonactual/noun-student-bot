const crypto=require('crypto');
const {db}=require('../lib/knowledge');
const SECRET=process.env.WEBHOOK_SECRET;
const FACULTIES={
  Agricultural_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-agricultural-sciences/',
  Arts:'https://nou.edu.ng/ecourseware-faculty-of-arts/',
  Computing:'https://nou.edu.ng/ecourseware-faculty-of-computing-2/',
  Education:'https://nou.edu.ng/ecourseware-faculty-of-edu/',
  Health_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-health-sc/',
  Law:'https://nou.edu.ng/ecourseware-faculty-of-law/',
  Management_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-management-sciences/',
  Sciences:'https://nou.edu.ng/ecourseware-faculty-of-sciences/',
  Social_Sciences:'https://nou.edu.ng/ecourseware-faculty-of-social-sciences/',
  DEAGS:'https://nou.edu.ng/ecourseware-degs/'
};
function clean(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()}
function rows(html){return [...String(html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(x=>clean(x[1]))).filter(r=>r.length>=4)}
function num(v){const m=String(v||'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):null}
module.exports=async(req,res)=>{if(req.method!=='POST')return res.status(405).json({error:'POST only'});if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});try{const wanted=req.body?.faculty;const list=wanted?Object.entries(FACULTIES).filter(([k])=>k===wanted):Object.entries(FACULTIES);let total=0,errors=[];for(const [faculty,url] of list){try{const r=await fetch(url,{headers:{'user-agent':'NOUN-Student-Bot-Courseware-Sync/1.0'}});if(!r.ok)throw new Error(String(r.status));const html=await r.text();const rs=rows(html);const {data:f,error:fe}=await db.from('academic_faculties').upsert({name:faculty,source_url:url,source_tier:1,verified_at:new Date().toISOString()},{onConflict:'name'}).select('id').single();if(fe)throw fe;for(const r of rs){const code=(r[0]||'').replace(/\s+/g,'').toUpperCase();if(!/^[A-Z]{2,6}\d{3}$/.test(code))continue;const title=r[1]||null;const credit=num(r[2]);const level=(r[3]||'').match(/\d{3}/)?.[0]||null;const semester=num(r[4]);const {data:c,error:ce}=await db.from('courses').upsert({course_code:code,title,credit_units:credit,source_url:url,source_tier:1,verification_status:'verified',verified_at:new Date().toISOString()},{onConflict:'course_code'}).select('id').single();if(ce)continue;await db.from('course_offerings').upsert({course_id:c.id,faculty_id:f.id,level,semester,credit_units:credit,source_url:url,source_tier:1,verified_at:new Date().toISOString()},{onConflict:'course_id,faculty_id,level,semester'});total++}}catch(e){errors.push({faculty,error:e.message})}}return res.status(200).json({ok:true,faculties:list.map(x=>x[0]),course_rows_processed:total,errors});}catch(e){console.error(e);return res.status(500).json({error:'Courseware sync failed',detail:e.message})}};
