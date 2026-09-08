const { db, tenantId } = require('../lib/knowledge');
const { buildStudentIntelligence, cleanPhone } = require('../lib/student-intelligence');
const SECRET=process.env.WEBHOOK_SECRET;
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});
 try{const phone=cleanPhone(req.query?.phone);if(!phone)return res.status(400).json({error:'phone required'});const intel=await buildStudentIntelligence(phone);return res.status(200).json({ok:true,events:intel.events||[],priorities:intel.priorities||[]});}
 catch(e){console.error('student-events:',e);return res.status(503).json({ok:false,error:'Student event service unavailable'});}
};
