const { createClient } = require('@supabase/supabase-js');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const ALLOWED=['textbooks','matric','graduation','id card','exam signature','clearance','internship','siwes','activity','event','service','career'];
function normalize(q){return String(q||'').toLowerCase().trim()}
async function searchServices(q,category){let query=db.from('student_services').select('*').eq('active',true);if(category)query=query.eq('category',category);const {data,error}=await query.order('verified',{ascending:false}).order('name');if(error)throw error;const n=normalize(q);return (data||[]).filter(x=>!n||[x.name,x.category,x.description].some(v=>normalize(v).includes(n))||ALLOWED.some(k=>n.includes(k)&&normalize(x.name).includes(k)))}
async function upcomingActivities(limit=20){const {data,error}=await db.from('school_activities').select('*').eq('status','verified').gte('start_at',new Date().toISOString()).order('start_at').limit(limit);if(error)throw error;return data||[]}
async function recordInterest(phone,type,value,confidence=.7,source='conversation'){if(!phone||!value)return;await db.from('student_interests').insert({phone,interest_type:type,value,confidence,source})}
module.exports={db,searchServices,upcomingActivities,recordInterest};
