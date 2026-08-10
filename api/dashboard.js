const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false } });

module.exports = async (req,res) => {
  if (req.method !== 'GET') return res.status(405).json({error:'GET only'});
  try {
    const [{data:students},{data:deadlines},{data:checklists},{data:campaigns},{data:help}] = await Promise.all([
      db.from('students').select('level,courses,stage,created_at'),
      db.from('deadlines').select('level,course,title,due_date').order('due_date',{ascending:true}).limit(30),
      db.from('exam_checklists').select('course,stamp1,stamp2,stamp3,laminated'),
      db.from('campaigns').select('id,name,status,created_at').order('created_at',{ascending:false}).limit(20),
      db.from('help_requests').select('status,created_at').order('created_at',{ascending:false}).limit(50)
    ]);
    const byLevel={}; const byCourse={};
    for(const s of students||[]){ byLevel[s.level]=(byLevel[s.level]||0)+1; for(const c of s.courses||[]) byCourse[c]=(byCourse[c]||0)+1; }
    const checkByCourse={};
    for(const c of checklists||[]){ const x=checkByCourse[c.course]||{students:0,steps:0}; x.students++; x.steps += [c.stamp1,c.stamp2,c.stamp3,c.laminated].filter(Boolean).length; checkByCourse[c.course]=x; }
    return res.status(200).json({
      generated_at:new Date().toISOString(),
      stats:{students:(students||[]).length,active_students:(students||[]).filter(s=>s.stage==='active').length,upcoming_deadlines:(deadlines||[]).filter(d=>new Date(d.due_date)>=new Date()).length,checklists:(checklists||[]).length,open_help:(help||[]).filter(h=>h.status==='open').length},
      by_level:byLevel, by_course:byCourse, checklist_by_course:checkByCourse,
      deadlines:deadlines||[], campaigns:campaigns||[]
    });
  } catch(e){ console.error(e); return res.status(500).json({error:'Dashboard unavailable'}); }
};
