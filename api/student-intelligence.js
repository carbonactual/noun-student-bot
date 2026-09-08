const { buildStudentIntelligence } = require('../lib/student-intelligence');
const SECRET = process.env.WEBHOOK_SECRET;
module.exports = async (req,res)=>{
  if(req.method!=='GET') return res.status(405).json({error:'GET only'});
  if(SECRET && req.headers['x-webhook-secret']!==SECRET) return res.status(401).json({error:'Unauthorized'});
  try {
    const phone=String(req.query?.phone||'').replace(/\D/g,'');
    if(!phone) return res.status(400).json({error:'phone required'});
    const result=await buildStudentIntelligence(phone, String(req.query?.q||''));
    return res.status(200).json({ok:true,...result});
  } catch(e){ console.error('student-intelligence:',e); return res.status(503).json({ok:false,error:'Student intelligence unavailable'}); }
};
