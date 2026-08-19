module.exports = async function handler(req, res) {
  const checks = {
    runtime: true,
    supabase_url: Boolean(process.env.SUPABASE_URL),
    supabase_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    webhook_secret: Boolean(process.env.WEBHOOK_SECRET),
    tenant: Boolean(process.env.DEFAULT_TENANT_SLUG || 'noun'),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY)
  };
  const required = ['supabase_url', 'supabase_service_role_key', 'webhook_secret'];
  const ready = required.every((key) => checks[key]);

  if (req.method === 'GET' && req.query?.check === 'gemini') {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ ok:false, service:'noun-student-bot', test:'gemini', configured:false, error:'GEMINI_API_KEY missing' });
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
        method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
        body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with exactly: NOUN GEMINI OK'}]}]})
      });
      const d=await r.json(); const candidates=Array.isArray(d?.candidates)?d.candidates:[]; const first=candidates[0]||{}; const parts=Array.isArray(first?.content?.parts)?first.content.parts:[]; const answer=parts.map(p=>p?.text||'').join('').trim(); const ok=r.ok&&answer.length>0;
      return res.status(ok?200:502).json({ok,service:'noun-student-bot',test:'gemini',model:'gemini-3.6-flash',configured:true,upstream_status:r.status,candidate_count:candidates.length,parts_count:parts.length,finish_reason:first?.finishReason||null,response:answer.slice(0,80)});
    } catch(e) { console.error('gemini smoke test:',e?.message||e); return res.status(502).json({ok:false,service:'noun-student-bot',test:'gemini',configured:true,error:'Gemini smoke test failed'}); }
  }

  if (req.method === 'GET' && req.query?.check === 'integration') {
    let stage='start';
    try {
      stage='load-knowledge';
      const {searchKnowledge,buildGrounding,db,tenantId}=require('../lib/knowledge');
      const tid=await tenantId();
      stage='student-lookup';
      const {data:student,error:studentError}=await db.from('students').select('phone,level,courses,faculty,department').eq('tenant_id',tid).limit(1).maybeSingle();
      if(studentError) return res.status(502).json({ok:false,test:'integration',stage,db_error:studentError.message,code:studentError.code||null});
      const question='Explain the difference between primary and secondary data in research in two concise sentences.';
      stage='knowledge-search';
      const knowledge=await searchKnowledge(question,{limit:10});
      const grounding=buildGrounding(knowledge);
      if(!process.env.GEMINI_API_KEY) return res.status(503).json({ok:false,test:'integration',stage,student_found:Boolean(student),knowledge_count:knowledge.facts.length,gemini_configured:false});
      stage='gemini-request';
      const prompt=`You are the NOUN Student Bot study-support AI. Answer as a tutor, not as an official NOUN officer. Student context: level=${student?.level||'unknown'}, courses=${(student?.courses||[]).join(', ')||'unknown'}, faculty=${student?.faculty||'unknown'}, department=${student?.department||'unknown'}. Use supplied evidence. If evidence is insufficient, say so. Do not invent NOUN rules or administrative facts. QUESTION: ${question}\n\nEVIDENCE:\n${grounding||'No verified evidence found.'}`;
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
      const d=await r.json(); const answer=d?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join('').trim()||'';
      if(!r.ok||!answer) return res.status(502).json({ok:false,test:'integration',stage,student_found:Boolean(student),knowledge_count:knowledge.facts.length,knowledge_confidence:knowledge.confidence,gemini_status:r.status,finish_reason:d?.candidates?.[0]?.finishReason||null});
      return res.status(200).json({ok:true,test:'integration',model:'gemini-3.6-flash',tenant:true,student_lookup:true,student_found:Boolean(student),knowledge_count:knowledge.facts.length,knowledge_confidence:knowledge.confidence,gemini_status:r.status,answer:answer.slice(0,500)});
    } catch(e) { console.error('integration smoke:',stage,e?.message||e); return res.status(500).json({ok:false,test:'integration',stage,error:'integration smoke test failed'}); }
  }

  return res.status(ready ? 200 : 503).json({ok:ready,service:'noun-student-bot',version:'2.0.5',environment:process.env.VERCEL_ENV||'unknown',checks,timestamp:new Date().toISOString()});
};
