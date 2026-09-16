function assetLiability(valueSent, valueReturned) {
  const sent = Number(valueSent);
  const returned = Number(valueReturned);
  if (!Number.isFinite(sent) || !Number.isFinite(returned)) return 'unknown';
  return returned > sent ? 'asset' : 'liability';
}

function pulseFromOutcome({ valueSent = 0, valueReturned = 0, eventName = 'noun.unknown', outcome = 'unknown', metadata = {} } = {}) {
  return {
    pulse_version: '1.0',
    event_name: String(eventName),
    outcome: String(outcome),
    value_sent: Number(valueSent),
    value_returned: Number(valueReturned),
    status: assetLiability(valueSent, valueReturned),
    occurred_at: new Date().toISOString(),
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  };
}

module.exports = { assetLiability, pulseFromOutcome };
