export type OmniiStudentAction = {
  capabilityRef: string
  authorityRef?: string | null
  evidenceRefs?: string[]
  requiresHuman?: boolean
}

const CONSEQUENTIAL = new Set(['official.submit', 'official.communicate', 'execution.send', 'execution.delete'])

export function classifyStudentAction(action: OmniiStudentAction) {
  const consequential = Boolean(action.requiresHuman) || CONSEQUENTIAL.has(action.capabilityRef)
  const allowed = !consequential || Boolean(action.authorityRef)
  return {
    consequential,
    allowed,
    reason: allowed ? (consequential ? 'authority-supplied' : 'advisory-or-support') : 'authority-required',
    authorityRef: action.authorityRef ?? null,
    evidenceRefs: [...(action.evidenceRefs ?? [])],
    officialPortalAccess: false,
    impersonation: false,
  }
}

export function toOmniiCommunicationEvent(input: { channel: string; externalId: string; summary: string }) {
  return {
    type: 'communication.message',
    sourceSystem: 'NOUN_STUDENT_BOT',
    channel: input.channel,
    externalId: input.externalId,
    summary: input.summary,
    providerIsAdapter: true,
  }
}
