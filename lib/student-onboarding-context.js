const REQUIRED = ['programme_title', 'level', 'semester', 'session'];

function text(value) {
  const v = String(value ?? '').trim();
  return v || null;
}

function normalizeStudentContext(input = {}) {
  return {
    full_name: text(input.full_name),
    programme_title: text(input.programme_title),
    level: text(input.level),
    faculty: text(input.faculty),
    department: text(input.department),
    semester: text(input.semester),
    session: text(input.session),
    study_centre: text(input.study_centre),
    exam_status: text(input.exam_status),
    notification_preferences: input.notification_preferences && typeof input.notification_preferences === 'object' ? input.notification_preferences : {}
  };
}

function buildOnboardingState(input = {}) {
  const ctx = normalizeStudentContext(input);
  const missing = REQUIRED.filter(key => !ctx[key]);
  return { complete: missing.length === 0, missing, context: ctx };
}

module.exports = { normalizeStudentContext, buildOnboardingState };
