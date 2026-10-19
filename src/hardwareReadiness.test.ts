import { describe, expect, it } from 'vitest'
import { DIAGNOSTIC_DEMO, parseDiagnosticReport } from './deviceDiagnostics'
import { candidateKey, EMPTY_OPERATOR_CLAIMS, evaluateReadiness, readinessReceipt } from './hardwareReadiness'
import type { OperatorClaims } from './hardwareReadiness'

const liveClaim = () => parseDiagnosticReport(JSON.stringify({
  ...DIAGNOSTIC_DEMO, source: 'WINDOWS_CIM_SNAPSHOT', platform: 'Windows',
}))
const complete: OperatorClaims = {
  modelLabel: 'Illustrative device from vendor documentation',
  interfaceClaim: 'WINDOWS_BDA', broadcastClaim: 'DVB_S2',
  driverReference: 'Official manufacturer driver guide',
  canAccessHardware: true, rightsAcknowledged: true,
}
describe('v1.2 conservative hardware readiness review', () => {
  it('never promotes missing report into verified hardware or receiver lock', () => {
    const res = evaluateReadiness(null, null, complete)
    expect(res.gate).toBe('NO_REPORT')
    expect(res.verifiedTuner).toBe(false)
    expect(res.verifiedRfLock).toBe(false)
    expect(res.verifiedPlayback).toBe(false)
    expect(res.steps.find((s) => s.id === 'rf')?.state).toBe('missing')
  })
  it('synthetic demo cannot attain review-packet state even when operator fields are filled', () => {
    const r = evaluateReadiness(DIAGNOSTIC_DEMO, DIAGNOSTIC_DEMO.devices[0], complete)
    expect(r.gate).toBe('DEMO_ONLY')
    expect(r.steps[0].state).toBe('blocked')
  })
  it('a user-supplied Windows report is still unverified, including OK PnP state', () => {
    const report = liveClaim()
    const r = evaluateReadiness(report, report.devices[0], complete)
    expect(r.gate).toBe('REVIEW_PACKET_PREPARED')
    expect(r.reviewPacketOnly).toBe(true)
    expect(r.verifiedTuner).toBe(false)
    expect(readinessReceipt(report, report.devices[0], complete, r)).toContain('UNVERIFIED_IMPORT_PLUS_UNVERIFIED_OPERATOR_ASSERTIONS')
  })
  it('blocks known Windows device issue regardless of manual assertions', () => {
    const report = liveClaim()
    const r = evaluateReadiness(report, report.devices[1], complete)
    expect(r.gate).toBe('WINDOWS_ISSUE_REPORTED')
  })
  it('blocks ambiguous Windows PnP state and unknown model/interface/standard', () => {
    const report = parseDiagnosticReport(JSON.stringify({
      ...liveClaim(), devices: [{ ...liveClaim().devices[0],
        windowsStatus: 'Unknown', configManagerErrorCode: null,
        diagnostic: 'WINDOWS_STATUS_UNCERTAIN' }],
    }))
    expect(evaluateReadiness(report, report.devices[0], complete).gate).toBe('WINDOWS_STATE_UNCERTAIN')
    const ok = liveClaim()
    expect(evaluateReadiness(ok, ok.devices[0], EMPTY_OPERATOR_CLAIMS).gate).toBe('AWAITING_INTERFACE_DETAILS')
  })
  it('does not approve review packet from incomplete operator acknowledgements', () => {
    const report = liveClaim()
    const r = evaluateReadiness(report, report.devices[0], { ...complete, rightsAcknowledged: false })
    expect(r.gate).toBe('AWAITING_OPERATOR_CONFIRMATION')
  })
  it('unknown, empty and foreign candidates cannot be selected', () => {
    const report = liveClaim()
    expect(evaluateReadiness(report, null, complete).gate).toBe('NO_CANDIDATE_SELECTED')
    expect(evaluateReadiness(report, { ...report.devices[0], name: 'Not in report' }, complete).gate).toBe('NO_CANDIDATE_SELECTED')
    const empty = parseDiagnosticReport(JSON.stringify({ ...report, devices: [] }))
    expect(evaluateReadiness(empty, null, complete).gate).toBe('NO_NAME_MATCHES')
    expect(candidateKey(report.devices[0])).toContain('rctv demo')
  })
  it('research packet excludes serials and includes every gate limitation', () => {
    const report = liveClaim()
    const r = evaluateReadiness(report, report.devices[0], complete)
    const parsed = JSON.parse(readinessReceipt(report, report.devices[0], complete, r)) as {
      kind: string; selectedCandidate: unknown; evaluation: { verifiedRfLock: boolean }
    }
    expect(parsed.kind).toBe('UNVERIFIED_ADAPTER_RESEARCH_PACKET')
    expect(parsed.selectedCandidate).not.toBeNull()
    expect(parsed.evaluation.verifiedRfLock).toBe(false)
  })
})
