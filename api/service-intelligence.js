const {ingest,expireStale,recordDemand}=require('../lib/service-intelligence');
const {db,tenantId}=require('../lib/knowledge');
const SECRET=process.env.WEBHOOK_SECRET;const CRON_SECRET=process.env.INTELLIGENCE_CRON_SECRET;
function authorized(req){return (SECRET&&req.headers['x-webhook-secret']===SECRET)||(CRON_SECRET&&req.headers['x-intelligence-secret']===CRON_SECRET)}
module.exports=async(req,res)=>{try{
 if(req.method==='GET'){if(SECRET&&!authorized(req))return res.status(401).json({error:'Unauthorized'});const tid=await tenantId();const q=String(req.query?.q||'').slice(0,160).toLowerCase();const {data,error}=await db.from('student_services').select('*').eq('tenant_id',tid).limit(100);if(error)throw error;const services=(data||[]).filter(x=>!q||q.split(/\s+/).filter(Boolean).every(t=>JSON.stringify(x).toLowerCase().includes(t))).slice(0,30);return res.status(200).json({ok:true,services,handoff:'Human support remains the route for consequential or official matters.'});}
 if(req.method!=='POST')return res.status(405).json({error:'GET or POST only'});
 if(!authorized(req))return res.status(401).json({error:'Unauthorized'});
 const action=req.body?.action||'expire';
 if(action==='ingest')return res.status(200).json({ok:true,result:await ingest(req.body.items||[])});
 if(action==='expire')return res.status(200).json({ok:true,expired:await expireStale()});
 if(action==='demand')return res.status(200).json({ok:true,recorded:await recordDemand(req.body)});
 return res.status(400).json({error:'Unknown action'});
 }catch(e){console.error(e);return res.status(500).json({error:'Service intelligence failed'});}};
