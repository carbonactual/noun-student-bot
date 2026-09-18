const { buildStudentIntelligence } = require('../lib/student-intelligence');
const { bearer, getUser } = require('../lib/auth');

module.exports = async (req,res)=>{
  if(req.method!=='GET') return res.status(405).json({error:'GET only'});
  try{
    const token=bearer(req);
    if(!token) return res.status(401).json({ok:false,error:'Sign in required'});
    const user=await getUser(token);
    const meta=user.user_metadata||{};
    const phone=String(meta.phone||'').replace(/\D/g,'');
    const requested=String(req.query?.phone||'').replace(/\D/g,'');
    if(!phone) return res.status(400).json({ok:false,error:'Account phone is missing'});
    if(requested && requested!==phone) return res.status(403).json({ok:false,error:'Student account mismatch'});
    const result=await buildStudentIntelligence(phone,String(req.query?.q||''));
    return res.status(200).json({ok:true,...result});
  }catch(e){
    console.error('student-intelligence:',e);
    const status=e.status===401?401:503;
    return res.status(status).json({ok:false,error:status===401?'Sign in required':'Student intelligence unavailable'});
  }
};