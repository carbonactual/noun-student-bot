const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../lib/cibn-catalog');

test('course catalog contains core programme maps', () => {
  assert.equal(catalog.course('601').name, 'Economics of Banking & Finance');
  assert.equal(catalog.course('701').name, 'Digital Banking');
  assert.equal(catalog.course('803').name, 'Lending and Credit Management');
  assert.equal(catalog.course('MF301').name, 'The Evolution Management and Regulation of Microfinancing');
  assert.equal(catalog.course('EP205').name, 'E-Payment Security, Audit & Compliance');
  assert.equal(catalog.course('CAB203').name, 'Risk, Control & Reconciliation');
});

test('CIBN session clashes are duration-aware, not timestamp-only', () => {
  assert.equal(catalog.conflicts(['601','602']).length, 0);
  assert.equal(catalog.conflicts(['701','702']).length, 0);
  assert.equal(catalog.conflicts(['MF301','MF302']).length, 0);
  assert.equal(catalog.conflicts(['MF303','MF402']).length, 0);
  assert.equal(catalog.conflicts(['EP101','EP102']).length, 0);
  assert.equal(catalog.conflicts(['CAB201','CAB202']).length, 0);
  assert.equal(catalog.conflicts(['MF301','MF302','MF403']).length, 0);
  assert.ok(catalog.sameSession(['MF301','MF302']).some(x => x.withinThreeHourCap));
  assert.ok(catalog.sameSession(['MF401','MF403']).some(x => x.withinThreeHourCap));
  assert.equal(catalog.sameSession(['MF301','MF302','MF403']).length, 0);
});

test('chartered banker elective limit is enforced', () => {
  const result = catalog.validateSelection(['805','806','807','808'], {program:'ACIB Chartered Banker'});
  assert.ok(result.errors.some(x => /maximum of three/i.test(x)));
});

test('publication catalogue has 75 entries and preserves observed price bands', () => {
  assert.equal(catalog.PUBLICATION_CATALOG.length, 75);
  assert.equal(catalog.PUBLICATION_CATALOG[0].priceNGN, 2000);
  assert.equal(catalog.PUBLICATION_CATALOG[60].priceNGN, 2000);
  assert.equal(catalog.PUBLICATION_CATALOG[61].priceNGN, 1000);
  assert.equal(catalog.PUBLICATION_CATALOG[69].priceNGN, 500);
  assert.equal(catalog.PUBLICATION_CATALOG[74].priceNGN, 1000);
});

test('interest discovery covers operational and control domains', () => {
  assert.ok(catalog.findInterest('I work in operations').some(x => x.key === 'operations'));
  assert.ok(catalog.findInterest('I am interested in credit').some(x => x.key === 'credit'));
  assert.ok(catalog.findInterest('I want to move into audit').some(x => x.key === 'audit'));
  assert.ok(catalog.findInterest('I want digital fintech').some(x => x.key === 'digital'));
  assert.ok(catalog.findInterest('agency banking').some(x => x.key === 'agency'));
});

test('portal boundary catalog contains exemption and mapping rules', () => {
  assert.match(catalog.RULES.exemptionFailedSubject.rule, /attempted and failed/i);
  assert.match(catalog.RULES.exemptionTiming.rule, /last examination paper/i);
  assert.match(catalog.RULES.exemptionUpload.rule, /2MB/i);
  assert.match(catalog.RULES.oldSubjectMapping.rule, /404/i);
});
