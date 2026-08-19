const { createClient } = require('@supabase/supabase-js');
const { nextRetry } = require('../lib/outbound');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
module.exports=async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  if(process.env.WEBHOOK_SECRET && req.headers['x-webhook-secret']!==process.env.WEBHOOK_SECRET)return res.status(401).json({error:'Unauthorized'});
  try{
    const id=Number(req.body?.id); const status=req.body?.status==='sent'?'sent':'failed'; if(!id)return res.status(400).json({error:'id required'});
    const {data:q,error:loadError}=await db.from('outbound_queue').select('*').eq('id',id).maybeSingle();
    if(loadError)throw loadError;
    if(!q)return res.status(404).json({error:'Queue item not found'});
    const patch={
      provider_message_id:req.body?.provider_message_id||null,
      last_error:req.body?.error||null,
      sent_at:status==='sent'?new Date().toISOString():null,
      locked_until:null
    };
    if(status==='sent'){
      patch.status='sent';
    }else{
      const retry=nextRetry(q.attempts);
      patch.status=retry.status;
      patch.available_at=retry.available_at;
    }
    const {error:updateError}=await db.from('outbound_queue').update(patch).eq('id',id);
    if(updateError)throw updateError;
    if(q.kind==='campaign' && q.source_id){
      const campaignPatch={
        status:status==='sent'?'sent':patch.status,
        provider_message_id:req.body?.provider_message_id||null,
        last_error:req.body?.error||null,
        sent_at:status==='sent'?new Date().toISOString():null
      };
      await db.from('campaign_messages').update(campaignPatch).eq('id',Number(q.source_id));
    }
    return res.status(200).json({ok:true,status:patch.status,available_at:patch.available_at||null});
  }catch(e){console.error(e);return res.status(500).json({error:'Ack failed'});}
};
