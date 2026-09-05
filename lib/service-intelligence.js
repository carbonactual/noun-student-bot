const {createClient}=require('@supabase/supabase-js');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const OFFICIAL=/^https:\/\/(?:www\.)?(?:nou\.edu\.ng|dqa\.nou\.edu\.ng|dea\.nou\.edu\.ng)\//i;
const CATEGORIES=[
  'textbooks','course_materials','handouts','matriculation','graduation','gown_regalia','id_card','exam_clearance','signatures','photocopying','printing','binding',
  'internship','siwes','employment','apprenticeship','nysc','student_event','club','sports','excursion','skills_acquisition','training','student_business','marketplace',
  'transport','accommodation','study_space','other'
];
function classify(title=' ',text=''){
  const s=`${title} ${text}`.toLowerCase();
  if(/gown|regalia/.test(s))return 'gown_regalia';
  if(/graduat/.test(s))return 'graduation';
  if(/matric/.test(s))return 'matriculation';
  if(/id card|identity card|student card/.test(s))return 'id_card';
  if(/signature|signing|clearance/.test(s))return 'signatures';
  if(/exam|examination/.test(s))return 'exam_clearance';
  if(/nysc/.test(s))return 'nysc';
  if(/apprentice/.test(s))return 'apprenticeship';
  if(/employment|job|vacanc/.test(s))return 'employment';
  if(/internship|siwes/.test(s))return /siwes/.test(s)?'siwes':'internship';
  if(/sport|football|basketball|athletic|game/.test(s))return 'sports';
  if(/excursion|tour|field trip/.test(s))return 'excursion';
  if(/skill acquisition|skills acquisition|learn a skill/.test(s))return 'skills_acquisition';
  if(/train|workshop|bootcamp|masterclass/.test(s))return 'training';
  if(/handout|course material/.test(s))return /handout/.test(s)?'handouts':'course_materials';
  if(/textbook|book/.test(s))return 'textbooks';
  if(/photocopy|copying/.test(s))return 'photocopying';
  if(/print/.test(s))return 'printing';
  if(/bind/.test(s))return 'binding';
  if(/student business|campus business|business listing/.test(s))return 'student_business';
  if(/marketplace|buy|sell|service provider/.test(s))return 'marketplace';
  if(/club|association|society/.test(s))return 'club';
  return 'other';
}
function authority(url,publisher){if(OFFICIAL.test(url))return {tier:1,label:'official_noun'}; if(publisher&&/known|verified/i.test(publisher))return {tier:4,label:'verified_secondary'}; return {tier:5,label:'external'};}
async function ingest(items=[]){let accepted=0,rejected=0; for(const x of items){const url=String(x.source_url||x.url||'').trim(); if(!url){rejected++;continue} const a=authority(url,x.publisher); const category=CATEGORIES.includes(x.category)?x.category:classify(x.title,x.description); const status=a.tier===1?'verified':x.verification_status==='verified'?'verified':'pending'; const expires=x.expires_at||null; const {error}=await db.from('student_services').upsert({title:x.title,category,description:x.description||null,provider_name:x.provider_name||null,provider_contact:x.provider_contact||null,price:x.price??null,currency:x.currency||'NGN',location:x.location||null,availability:x.availability||null,source_url:url,authority_tier:a.tier,source_type:a.label,verification_status:status,last_verified_at:new Date().toISOString(),expires_at:expires,metadata:x.metadata||{}},{onConflict:'source_url'}); if(error)rejected++; else accepted++;} return {accepted,rejected};}
async function expireStale(){const now=new Date().toISOString(); const {data,error}=await db.from('student_services').update({verification_status:'expired'}).lt('expires_at',now).in('verification_status',['verified','pending']).select('id'); if(error)throw error; return data?.length||0;}
async function recordDemand({category,query,course,level,phone}){const {error}=await db.from('intelligence_signals').insert({signal_type:'service_demand',category,query:query||null,course:course||null,level:level||null,phone_hash:phone?require('crypto').createHash('sha256').update(phone).digest('hex'):null,created_at:new Date().toISOString(),metadata:{privacy:'phone hashed; use only for aggregate intelligence'}}); if(error)throw error; return true;}
module.exports={CATEGORIES,ingest,expireStale,recordDemand,classify};
