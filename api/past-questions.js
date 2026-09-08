const { db, tenantId } = require('../lib/knowledge');
const { cleanPhone, getStudent } = require('../lib/student-intelligence');
const SECRET=process.env.WEBHOOK_SECRET;
function score(q,row){const tokens=String(q||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);const blob=JSON.stringify(row).toLowerCase();return tokens.reduce((n,t)=>n+(blob.includes(t)?1:0),0);}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});
 try{const tid=await tenantId();const phone=cleanPhone(req.query?.phone);const q=String(req.query?.q||'').slice(0,180);const course=String(req.query?.course||'').slice(0,80);const student=phone?await getStudent(phone):null;const courses=Array.isArray(student?.courses)?student.courses:[];
  const {data,error}=await db.from('past_questions').select('*').eq('tenant_id',tid).in('verification_status',['official','verified_secondary','original','approved']).limit(200);
  if(error)throw error;let rows=(data||[]).map(row=>({row,_score:score(`${q} ${course}`,row)+(courses.some(c=>JSON.stringify(row).toLowerCase().includes(String(c).toLowerCase()))?2:0)})).sort((a,b)=>b._score-a._score).slice(0,20).map(({row})=>row);
  return res.status(200).json({ok:true,revision_only:true,notice:'Past questions are provided for revision. They are not official examination papers unless explicitly verified as such.',questions:rows});
 }catch(e){console.error('past-questions:',e);return res.status(503).json({ok:false,error:'Past-question source unavailable'});}
};
