const {db}=require('../lib/knowledge');
const SECRET=process.env.WEBHOOK_SECRET;
const STOP=new Set(['what','when','where','which','with','that','this','from','have','does','about','your','their','course','please','help','can','how','why','the','and','for']);
function topics(text){return [...new Set(String(text||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>4&&!STOP.has(w)))].slice(0,8)}
async function generate(){
 const since=new Date(Date.now()-7*86400000).toISOString();
 const {data:events,error}=await db.from('message_events').select('phone,message_text,created_at').eq('direction','inbound').gte('created_at',since).limit(10000); if(error)throw error;
 const byTopic=new Map(); const byPhone=new Set();
 for(const e of events||[]){byPhone.add(e.phone);for(const t of topics(e.message_text)){const x=byTopic.get(t)||{count:0,phones:new Set()};x.count++;x.phones.add(e.phone);byTopic.set(t,x)}}
 const ranked=[...byTopic.entries()].filter(([,v])=>v.count>=3).sort((a,b)=>b[1].count-a[1].count).slice(0,20);
 const created=[];
 for(const [topic,v] of ranked){const confidence=Math.min(.95,.45+Math.min(.45,v.count/30));const title=`Emerging student topic: ${topic}`;const text=`Across the last 7 days, ${v.phones.size} students generated ${v.count} inbound interactions containing the topic “${topic}”. This is an aggregate signal, not a diagnosis of individual students. Validate against official NOUN information before publishing a student-facing message.`;const {data:i,error:ie}=await db.from('insights').insert({scope:'institution',subject_key:topic,title,insight_text:text,evidence_count:v.count,confidence,source_tier:4,status:'draft'}).select('id').single();if(ie)continue;await db.from('insight_evidence').insert({insight_id:i.id,evidence_type:'message_frequency',evidence_key:topic,metric:v.count,metadata:{unique_students:v.phones.size,window_days:7}});await db.from('insight_recommendations').insert({insight_id:i.id,action_type:'review',recommendation:`Review official NOUN sources related to “${topic}” before considering an educational insight or campaign.`,target_definition:{topic}});created.push({id:i.id,topic,count:v.count,unique_students:v.phones.size})}
 return {window_days:7,active_students:byPhone.size,inbound_events:(events||[]).length,insights_created:created.length,insights:created};
}
module.exports=async(req,res)=>{if(req.method!=='POST')return res.status(405).json({error:'POST only'});if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});try{return res.status(200).json({ok:true,result:await generate()})}catch(e){console.error(e);return res.status(500).json({error:'Insight generation failed',detail:e.message})}};
