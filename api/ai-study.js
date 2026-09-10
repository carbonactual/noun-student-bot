const {searchKnowledge,buildGrounding,recordActivity,db,tenantId}=require('../lib/knowledge');
const {buildStudentIntelligence}=require('../lib/student-intelligence');
const {normalizeMode}=require('../lib/learning-continuity');
const SECRET=process.env.WEBHOOK_SECRET;const KEY=process.env.GEMINI_API_KEY;
function safe(v,n=3500){return String(v||'').slice(0,n)}
async function startLearningSession(tid,phone,course,mode){
 const {data,error}=await db.from('student_learning_sessions').insert({tenant_id:tid,student_phone:phone,course_code:course||null,mode,started_at:new Date().toISOString(),question_count:0,metadata:{source:'ai-study'}}).select('id').single();
 if(error) throw error; return data.id;
}
async function persistStudyQuestion(tid,phone,course,mode,question,answer,confidence,sessionId){
 const {data,error}=await db.from('student_study_questions').insert({tenant_id:tid,student_phone:phone,course_code:course||null,question,mode,status:'answered',answer_summary:safe(answer,1200),knowledge_confidence:confidence,answered_at:new Date().toISOString()}).select('id').single();
 if(error) throw error;
 if(sessionId) await db.from('student_learning_sessions').update({ended_at:new Date().toISOString(),question_count:1}).eq('id',sessionId).eq('tenant_id',tid);
 return data.id;
}
module.exports=async(req,res)=>{if(req.method!=='POST')return res.status(405).json({error:'POST only'});if(SECRET&&req.headers['x-webhook-secret']!==SECRET)return res.status(401).json({error:'Unauthorized'});try{
 const phone=String(req.body?.phone||'').replace(/\D/g,'');const question=safe(req.body?.question);const mode=normalizeMode(req.body?.mode);const course=safe(req.body?.course,80);
 if(!phone||!question)return res.status(400).json({error:'phone and question required'});
 const tid=await tenantId();
 const studentIntel=await buildStudentIntelligence(phone,`${course} ${question}`);
 const knowledge=await searchKnowledge(`${course} ${question}`,{limit:12,live:true});const grounding=buildGrounding(knowledge);
 const personal=`PROFILE: ${studentIntel.student?JSON.stringify(studentIntel.student):'unknown'}\nPRIORITIES: ${JSON.stringify(studentIntel.priorities||[])}\nUPCOMING EVENTS: ${JSON.stringify(studentIntel.events||[])}\nRECENT LEARNING ACTIVITY: ${JSON.stringify(studentIntel.recent_activity||[])}\nMATCHED PRACTICE MATERIAL: ${JSON.stringify(studentIntel.practice||[])}`;
 const modeInstruction={tutor:'Teach the concept clearly, starting from the learner’s current level. Check understanding and give a small practice question.',tutorial:'Act as a guided tutorial. Break the topic into short lessons, explain each step, then ask the learner to continue.',practice:'Use matched past questions or original practice questions for revision. Give hints first, then explain the solution. Never complete a live assessment.',revision:'Create a focused revision session: key ideas, likely weak spots, recall prompts, then a short self-test.'}[mode];
 const prompt=`You are NOUN BOT, a personalised academic companion for National Open University of Nigeria students. ${modeInstruction}\nAnswer as a tutor, not as an official NOUN officer. Tailor the response to this student when the context supports it. Never expose private profile information unnecessarily. Official NOUN evidence outranks secondary evidence. Distinguish LIVE WEB EVIDENCE from cached/database evidence, and prefer fresh authoritative evidence when relevant. A live source does not mean you accessed the student's private NOUN portal. Never claim portal access unless a verified integration exists. If sources conflict, say so. If evidence is insufficient, say so. Never invent NOUN rules, dates, eligibility, results, registration status, fees or administrative decisions. Do not answer a live exam or facilitate academic misconduct. For administrative matters, explain and route to an appropriate human/official service.\n\nSTUDENT INTELLIGENCE:\n${personal}\n\nVERIFIED EVIDENCE:\n${grounding||'No verified evidence found.'}\n\nLIVE EVIDENCE COUNT: ${(knowledge.live_facts||[]).length}\n\nQUESTION:\n${question}`;
 if(!KEY)return res.status(503).json({error:'AI unavailable',confidence:knowledge.confidence,grounding});
 const sessionId=await startLearningSession(tid,phone,course,mode);
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}]})});
 const d=await r.json();const answer=d?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join('').trim();
 if(!r.ok||!answer)return res.status(502).json({error:'AI returned no answer',upstream_status:r.status,confidence:knowledge.confidence,grounding});
 let questionId=null;try{questionId=await persistStudyQuestion(tid,phone,course,mode,question,answer,knowledge.confidence,sessionId)}catch(persistError){console.error('learning continuity persistence:',persistError);await db.from('student_activity').insert({tenant_id:tid,phone,event_type:'learning_continuity_persistence_failed',course_code:course||null,topic:question.split(/\s+/).slice(0,8).join(' '),metadata:{error:String(persistError?.message||persistError)}})}
 await recordActivity(phone,'study_question',course||null,question.split(/\s+/).slice(0,8).join(' '),{knowledge_confidence:knowledge.confidence,mode,live_evidence_count:(knowledge.live_facts||[]).length,question_id:questionId,session_id:sessionId});
 return res.status(200).json({ok:true,answer,confidence:knowledge.confidence,sources:knowledge.sources,student_context:studentIntel.personalized,mode,live_evidence_count:(knowledge.live_facts||[]).length,continuity:{question_id:questionId,session_id:sessionId}});
 }catch(e){console.error(e);return res.status(500).json({error:'AI study request failed'})}};
