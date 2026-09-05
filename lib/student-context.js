const ACTIVE_STATUSES = new Set(['prospective','applicant','admitted','active','deferred']);

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function buildStudentContext(student = {}, programmes = [], activity = [], preferences = {}) {
  const programmeRows = (programmes || []).map(p => ({
    programme_id: p.programme_id || p.id || null,
    programme_title: p.programme_title || p.title || null,
    study_level: p.study_level || null,
    academic_status: p.academic_status || 'active',
    is_primary: p.is_primary === true,
    admission_session: p.admission_session || null,
    expected_completion_date: p.expected_completion_date || null
  }));
  const primary = programmeRows.find(p => p.is_primary) || programmeRows.find(p => p.academic_status === 'active') || {
    study_level: student.study_level || null,
    programme_title: student.programme_title || null,
    academic_status: student.academic_status || 'applicant'
  };
  const skills = unique((activity || []).filter(a => a.event_type === 'skill_interest').map(a => a.metadata?.skill || a.topic));
  const opportunityInterests = unique((activity || []).filter(a => a.event_type === 'opportunity_interest').map(a => a.metadata?.category || a.topic));
  const serviceInterests = unique((activity || []).filter(a => a.event_type === 'service_interest').map(a => a.metadata?.category || a.topic));
  return {
    identity: { phone: student.phone || null, full_name: student.full_name || null },
    academic: {
      primary,
      programmes: programmeRows,
      study_level: primary.study_level || student.study_level || null,
      academic_status: primary.academic_status || student.academic_status || 'applicant',
      faculty: student.faculty || null,
      department: student.department || null,
      courses: unique(student.courses || []),
      is_active: ACTIVE_STATUSES.has(primary.academic_status || student.academic_status)
    },
    interests: {
      skills,
      opportunities: opportunityInterests,
      services: serviceInterests
    },
    preferences: {
      reminder_opt_in: preferences.reminder_opt_in !== false,
      campaign_opt_in: preferences.campaign_opt_in !== false,
      insight_opt_in: preferences.insight_opt_in !== false
    },
    visibility: {
      marketplace_public: preferences.marketplace_public === true,
      published_skills: unique(preferences.published_skills || []),
      published_services: unique(preferences.published_services || [])
    }
  };
}

module.exports = { buildStudentContext };
