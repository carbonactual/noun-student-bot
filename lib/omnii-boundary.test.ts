import { strict as assert } from 'node:assert'
import test from 'node:test'
import { classifyStudentAction, toOmniiCommunicationEvent } from './omnii-boundary'

test('student support remains advisory unless explicitly authorized', () => {
  const result = classifyStudentAction({ capabilityRef: 'official.submit', requiresHuman: true })
  assert.equal(result.allowed, false)
  assert.equal(result.officialPortalAccess, false)
  assert.equal(result.impersonation, false)
})

test('authorized consequential communication is explicitly represented', () => {
  const result = classifyStudentAction({ capabilityRef: 'official.communicate', authorityRef: 'authority:human:1' })
  assert.equal(result.allowed, true)
})

test('WhatsApp/Meta remains an adapter rather than identity authority', () => {
  const event = toOmniiCommunicationEvent({ channel: 'whatsapp', externalId: 'wamid:1', summary: 'student message' })
  assert.equal(event.type, 'communication.message')
  assert.equal(event.providerIsAdapter, true)
})
