const {searchKnowledge,buildGrounding,db}=require('../lib/knowledge');
const {tenantId}=require('../lib/knowledge');
const GEMINI_API_KEY=process.env.GEMINI_API_KEY;
const MODEL='gemini-3.6-flash';
const QUESTION='Explain the difference between primary and secondary data in research in two concise sentences.';
module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'GET only'});
  try{
    const tid=await tenantId();
    const {data:student,error:studentError}=await db.from('students').select('phone,level,courses,faculty,department').eq('tenant_id',tid).limit(1).maybeSingle();
    if(studentError)throw studentError;
    const knowledge=await searchKnowledge(QUESTION,{limit:10});
    const grounding=buildGrounding(knowledge);
    if(!GEMINI_API_KEY)return res.status(503).json({ok:false,test:'integration',tenant:true,student_lookup:!studentError,knowledge_count:knowledge.facts.length,gemini_configured:false});
    const prompt=`You are the NOUN Student Bot study-support AI. Answer as a tutor, not as an official NOUN officer. Student context: level=${student?.level||'unknown'}, courses=${(student?.courses||[]).join(', ')||'unknown'}, faculty=${student?.faculty||'unknown'}, department=${student?.department||'unknown'}. Use the supplied evidence. If evidence is insufficient, say so. Do not invent NOUN rules or administrative facts. QUESTION: ${QUESTION}\n\nEVIDENCE:\n${grounding||'No verified evidence found.'}`;
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    const d=await r.json();
    const answer=d?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join('').trim()||'';
    const ok=r.ok&&answer.length>0;
    return res.status(ok?200:502).json({ok,test:'integration',model:MODEL,tenant:true,student_lookup:!studentError,student_found:Boolean(student),knowledge_count:knowledge.facts.length,knowledge_confidence:knowledge.confidence,gemini_status:r.status,answer:answer.slice(0,500)});
  }catch(e){console.error('integration smoke:',e?.message||e);return res.status(500).json({ok:false,test:'integration',error:'integration smoke test failed'});}
};
