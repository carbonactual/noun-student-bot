const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const SECRET = process.env.WEBHOOK_SECRET;
const DAY = 24*60*60*1000;
let tenantIdPromise;
async function tenantId(){
  if(!tenantIdPromise) tenantIdPromise=db.from('tenants').select('id').eq('slug',process.env.DEFAULT_TENANT_SLUG||'noun').eq('status','active').single().then(({data,error})=>{if(error||!data)throw error||new Error('Active tenant missing');return data.id;});
  return tenantIdPromise;
}

async function queueDeadlineNotifications(){
  const tid=await tenantId(),now=new Date();
  const {data:deadlines,error}=await db.from('deadlines').select('*').eq('tenant_id',tid).gte('due_date',now.toISOString().slice(0,10));
  if(error) throw error;
  let created=0;
  for(const d of deadlines||[]){
    const due=new Date(`${d.due_date}T23:59:59Z`),days=Math.ceil((due-now)/DAY);
    if(![3,1].includes(days)||(d.reminded_at||[]).includes(days))continue;
    const {data:students}=await db.from('students').select('phone,level,courses').eq('tenant_id',tid).eq('level',d.level).contains('courses',[d.course]).eq('whatsapp_opt_in',true);
    for(const s of students||[]){
      const text=`⏰ NOUN reminder\n\n${d.title}\n${d.course}\nDue: ${d.due_date}\n\n${days} day${days===1?'':'s'} remaining.`;
      const {error:e}=await db.from('outbound_queue').insert({tenant_id:tid,phone:s.phone,message_text:text,kind:'deadline',source_id:String(d.id)});
      if(!e)created++;
    }
    await db.from('deadlines').update({reminded_at:[...(d.reminded_at||[]),days]}).eq('tenant_id',tid).eq('id',d.id);
  }
  return created;
}

module.exports=async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});
  try{
    const tid=await tenantId(),action=req.body?.action;
    if(action==='deadline-dispatch')return res.status(200).json({queued:await queueDeadlineNotifications()});
    if(action==='campaign-dispatch'){
      const now=new Date().toISOString();
      const {data,error}=await db.from('campaign_messages').select('*').eq('tenant_id',tid).eq('status','queued').lte('scheduled_at',now).limit(50);
      if(error)throw error;
      let queued=0;
      for(const m of data||[]){
        const {data:s}=await db.from('students').select('whatsapp_opt_in').eq('tenant_id',tid).eq('phone',m.phone).maybeSingle();
        if(!s?.whatsapp_opt_in){await db.from('campaign_messages').update({status:'cancelled',last_error:'Student opted out'}).eq('tenant_id',tid).eq('id',m.id);continue;}
        const {error:e}=await db.from('outbound_queue').insert({tenant_id:tid,phone:m.phone,message_text:m.rendered_message,kind:'campaign',source_id:String(m.id)});
        if(!e){await db.from('campaign_messages').update({status:'processing',attempts:m.attempts+1}).eq('tenant_id',tid).eq('id',m.id);queued++;}
      }
      return res.status(200).json({queued,messages:(data||[]).slice(0,50).map(m=>({id:m.id,to:m.phone,text:m.rendered_message}))});
    }
    return res.status(400).json({error:'Unknown action'});
  }catch(e){console.error(e);return res.status(500).json({error:'Automation failed'});}
};
