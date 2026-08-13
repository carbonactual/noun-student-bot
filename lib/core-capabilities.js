const AUTONOMOUS = new Set([
  'read', 'analyze', 'classify', 'organize', 'monitor', 'recommend', 'report',
  'explain', 'match', 'notify', 'escalate'
]);

const APPROVAL_REQUIRED = new Set([
  'publish', 'delete', 'submit_institutional_action', 'send_campaign',
  'approve_credit', 'originate_loan', 'move_money', 'execute_payment',
  'execute_trade', 'change_consent', 'change_authorization'
]);

function canPerform(capability, { approved = false, actorRole = 'student' } = {}) {
  if (AUTONOMOUS.has(capability)) return true;
  if (APPROVAL_REQUIRED.has(capability)) return approved && ['institution_admin', 'platform_operator', 'authorized_user'].includes(actorRole);
  return false;
}

function requiresApproval(capability) {
  return APPROVAL_REQUIRED.has(capability);
}

function financialExecutionAllowed() {
  return false;
}

module.exports = { AUTONOMOUS, APPROVAL_REQUIRED, canPerform, requiresApproval, financialExecutionAllowed };
