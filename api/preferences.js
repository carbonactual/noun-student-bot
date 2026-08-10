const { createClient } = require('@supabase/supabase-js');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
module.exports=async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  if(process.env.WEBHOOK_SECRET && req.headers['x-webhook-secret']!==process.env.WEBHOOK_SECRET)return res.status(401).json({error:'Unauthorized'});
  const phone=String(req.body?.from||'').replace(/\D/g,''); const command=String(req.body?.text||'').trim().toLowerCase(); if(!phone)return res.status(400).json({error:'from required'});
  if(['stop','unsubscribe','optout','opt out'].includes(command)){await db.from('students').upsert({phone,whatsapp_opt_in:false,updated_at:new Date().toISOString()});return res.status(200).json({reply:'You are unsubscribed from NOUN Student Bot WhatsApp campaigns and reminders. Reply START anytime to opt back in.',to:phone});}
  if(['start','subscribe','optin','opt in'].includes(command)){await db.from('students').upsert({phone,whatsapp_opt_in:true,updated_at:new Date().toISOString()});return res.status(200).json({reply:'✅ WhatsApp notifications are enabled again. Reply HELP for the menu.',to:phone});}
  return res.status(200).json({reply:null,to:phone});
};
