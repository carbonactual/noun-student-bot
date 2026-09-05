const test = require('node:test');
const assert = require('node:assert/strict');
const { NANO_FINANCE_STAGES, financialBoundary } = require('../lib/student-ecosystem');

test('NOUN nano-finance is modeled as discovery through provider routing before I/O execution', () => {
  assert.deepEqual(NANO_FINANCE_STAGES, [
    'need_capture',
    'financial_education',
    'opportunity_discovery',
    'eligibility_explanation',
    'terms_explanation',
    'provider_routing',
    'io_execution'
  ]);
});

test('NOUN cannot execute regulated financial actions', () => {
  for (const action of ['originate_loan','approve_credit','collect_repayment','move_money','execute_payment','operate_wallet','settle_transaction']) {
    assert.equal(financialBoundary(action).allowed, false, action);
  }
});
