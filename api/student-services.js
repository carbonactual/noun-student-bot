const { db, tenantId } = require('../lib/knowledge');
const { cleanPhone } = require('../lib/student-intelligence');
const SECRET=process.env.WEBHOOK_SECRET;
function matches(row, q){if(!q)return true;const blob=JSON.stringify(row).toLowerCase();return String(q).toLowerCase().split(/\s+/).filter(Boolean).every(t=>blob.includes(t));}
module.exports=async(req,res)=>{
 if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});
 try{const tid=await tenantId();
  if(req.method==='GET'){
   const phone=cleanPhone(req.query?.phone);const q=String(req.query?.q||'').slice(0,160);if(!phone)return res.status(400).json({error:'phone required'});
   const {data,error}=await db.from('student_services').select('*').eq('tenant_id',tid).limit(100);if(error)throw error;
   return res.status(200).json({ok:true,services:(data||[]).filter(x=>matches(x,q)).slice(0,30)});
  }
  if(req.method==='POST'){
   const phone=cleanPhone(req.body?.phone);const title=String(req.body?.title||'').trim().slice(0,160);const description=String(req.body?.description||'').trim().slice(0,1200);
   if(!phone||!title)return res.status(400).json({error:'phone and title required'});
   const payload={tenant_id:tid,phone,title,description:description||null,status:'open',metadata:{source:'noun-bot',service_id:req.body?.service_id||null}};
   const {data,error}=await db.from('help_requests').insert(payload).select('*').maybeSingle();if(error)throw error;
   return res.status(201).json({ok:true,request:data||null,message:'Your request has been routed for human follow-up.'});
  }
  return res.status(405).json({error:'GET or POST only'});
 }catch(e){console.error('student-services:',e);return res.status(503).json({ok:false,error:'Student service routing unavailable'});}
};
