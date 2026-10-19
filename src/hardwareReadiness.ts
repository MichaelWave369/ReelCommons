/**
 * RCTV v1.2 Hardware Readiness Gate.
 * Evaluates imported, UNAUTHENTICATED Windows CIM candidate metadata plus
 * explicitly identified, UNVERIFIED operator assertions. It NEVER establishes
 * verified hardware, RF lock, service reception, or lawful playback.
 */
import type { DiagnosticCandidate, DiagnosticReport } from './deviceDiagnostics'

export type InterfaceClaim = 'UNKNOWN' | 'WINDOWS_BDA' | 'SAT_IP' | 'VENDOR_SDK' | 'SDR' | 'OTHER'
export type BroadcastClaim = 'UNKNOWN' | 'ATSC_1' | 'ATSC_3' | 'DVB_S' | 'DVB_S2' | 'DVB_T' | 'DVB_T2' | 'DVB_C' | 'SDR_NON_TV' | 'OTHER'
export type GateStatus =
  | 'NO_REPORT' | 'DEMO_ONLY' | 'NO_NAME_MATCHES' | 'NO_CANDIDATE_SELECTED'
  | 'WINDOWS_ISSUE_REPORTED' | 'WINDOWS_STATE_UNCERTAIN'
  | 'AWAITING_INTERFACE_DETAILS' | 'AWAITING_OPERATOR_CONFIRMATION' | 'REVIEW_PACKET_PREPARED'
export interface OperatorClaims {
  modelLabel: string
  interfaceClaim: InterfaceClaim
  broadcastClaim: BroadcastClaim
  canAccessHardware: boolean
  rightsAcknowledged: boolean
  driverReference: string
}
export const EMPTY_OPERATOR_CLAIMS: OperatorClaims = {
  modelLabel: '', interfaceClaim: 'UNKNOWN', broadcastClaim: 'UNKNOWN',
  canAccessHardware: false, rightsAcknowledged: false, driverReference: '',
}
export interface ReadinessStep {
  id: string
  name: string
  state: 'reported' | 'operator-claimed' | 'missing' | 'blocked'
  description: string
}
export interface ReadinessEvaluation {
  gate: GateStatus
  headline: string
  reviewPacketOnly: true
  verifiedTuner: false
  verifiedRfLock: false
  verifiedPlayback: false
  recommendedNextAction: string
  steps: ReadinessStep[]
}
const LIMIT = (s: string, max: number): string => s.trim().slice(0, max)
export function candidateKey(device: DiagnosticCandidate): string {
  return JSON.stringify([device.name.toLowerCase().trim(), device.deviceClass.toLowerCase().trim()])
}
const hasDetail = (value: string, min: number) => LIMIT(value, 150).length >= min

export function evaluateReadiness(
  report: DiagnosticReport | null,
  candidate: DiagnosticCandidate | null,
  claims: OperatorClaims,
): ReadinessEvaluation {
  const isDemo = report?.source === 'SYNTHETIC_DEMO'
  const candidateIsListed = !!(report && candidate &&
    report.devices.some((device) => candidateKey(device) === candidateKey(candidate)))
  const osGood = !!(candidateIsListed && candidate?.diagnostic === 'WINDOWS_REPORTS_OK')
  const details = hasDetail(claims.modelLabel, 3) && claims.interfaceClaim !== 'UNKNOWN' &&
    claims.broadcastClaim !== 'UNKNOWN' && (claims.driverReference === '' || hasDetail(claims.driverReference, 3))
  const operatorConfirmed = claims.canAccessHardware && claims.rightsAcknowledged
  const steps: ReadinessStep[] = [
    {
      id: 'inventory', name: 'Local report imported',
      state: !report ? 'missing' : isDemo ? 'blocked' : 'reported',
      description: !report ? 'Import a Windows diagnostic report or try a demo.' :
        isDemo ? 'Synthetic data never qualifies for hardware-adapter review.' :
        'User-imported Windows report claims OS inventory; its origin is not authenticated.',
    },
    {
      id: 'candidate', name: 'Potential tuner candidate',
      state: !candidateIsListed ? 'missing' : isDemo ? 'blocked' : 'reported',
      description: !candidateIsListed ? 'Select a name-matched candidate from the imported report.' :
        isDemo ? 'Demo candidate is imaginary.' : 'The display-name match does not prove tuner compatibility.',
    },
    {
      id: 'os', name: 'Windows-reported device condition',
      state: !candidateIsListed ? 'missing' : !osGood || isDemo ? 'blocked' : 'reported',
      description: !candidateIsListed ? 'No candidate has been selected.' :
        candidate?.diagnostic === 'WINDOWS_REPORTS_DEVICE_ISSUE' ? 'Windows reported a PnP issue. Check Device Manager before planning a receiver adapter.' :
        candidate?.diagnostic === 'WINDOWS_STATUS_UNCERTAIN' ? 'Windows device condition was incomplete or ambiguous.' :
        'Windows reported status OK and error code 0. This does not establish working RF hardware.',
    },
    {
      id: 'interface', name: 'Adapter interface and broadcast standard',
      state: !details ? 'missing' : 'operator-claimed',
      description: !details ? 'Enter a model label, claimed interface and reception standard. These are unverified assertions.' :
        'Model/interface/standard are supplied by the operator; no hardware probe checked them.',
    },
    {
      id: 'authorization', name: 'Physical access and permitted test',
      state: !operatorConfirmed ? 'missing' : 'operator-claimed',
      description: !operatorConfirmed ? 'Confirm physical access and intention to test only permitted, unencrypted signals.' :
        'Operator acknowledgements do not authenticate hardware or reception rights.',
    },
    {
      id: 'rf', name: 'Actual signal and decoded program evidence',
      state: 'missing',
      description: 'Not collected by v1.2. Requires a separate opt-in hardware interface and independent verification.',
    },
  ]
  let gate: GateStatus
  let headline: string
  let recommendedNextAction: string
  if (!report) {
    gate = 'NO_REPORT'; headline = 'Awaiting a Windows inventory'
    recommendedNextAction = 'Run the opt-in Windows diagnostics command and import the JSON locally.'
  } else if (isDemo) {
    gate = 'DEMO_ONLY'; headline = 'Synthetic example only'
    recommendedNextAction = 'Use an actual Windows-generated report to prepare an adapter research packet.'
  } else if (!report.devices.length) {
    gate = 'NO_NAME_MATCHES'; headline = 'No matching tuner names reported'
    recommendedNextAction = 'Inspect Windows Device Manager and verify whether a tuner is connected; name filters can miss hardware.'
  } else if (!candidateIsListed) {
    gate = 'NO_CANDIDATE_SELECTED'; headline = 'Select a possible receiver'
    recommendedNextAction = 'Choose one name-matched device from the imported Windows report.'
  } else if (candidate?.diagnostic === 'WINDOWS_REPORTS_DEVICE_ISSUE') {
    gate = 'WINDOWS_ISSUE_REPORTED'; headline = 'Windows reported a device issue'
    recommendedNextAction = 'Inspect Windows Device Manager and manufacturer documentation; this app changes no drivers.'
  } else if (!osGood) {
    gate = 'WINDOWS_STATE_UNCERTAIN'; headline = 'Windows state remains uncertain'
    recommendedNextAction = 'Review the source Windows diagnostic status and driver readiness before an adapter is designed.'
  } else if (!details) {
    gate = 'AWAITING_INTERFACE_DETAILS'; headline = 'Need device/interface details'
    recommendedNextAction = 'Identify the exact receiver model, applicable Windows interface and broadcast standard from trusted documentation.'
  } else if (!operatorConfirmed) {
    gate = 'AWAITING_OPERATOR_CONFIRMATION'; headline = 'Need explicit test acknowledgements'
    recommendedNextAction = 'Confirm you can access the hardware and intend to work only with permitted unencrypted signals.'
  } else {
    gate = 'REVIEW_PACKET_PREPARED'; headline = 'Adapter research packet prepared'
    recommendedNextAction = 'Review manufacturer docs and choose a device-specific, opt-in, read-only telemetry prototype. Do not assume hardware has been verified.'
  }
  return {
    gate, headline, reviewPacketOnly: true, verifiedTuner: false,
    verifiedRfLock: false, verifiedPlayback: false, recommendedNextAction, steps,
  }
}
export function readinessReceipt(
  report: DiagnosticReport | null,
  candidate: DiagnosticCandidate | null,
  claims: OperatorClaims,
  evaluation: ReadinessEvaluation,
): string {
  return JSON.stringify({
    schema: 'RCTV_HARDWARE_READINESS_V1', kind: 'UNVERIFIED_ADAPTER_RESEARCH_PACKET',
    reportedReportSource: report?.source ?? null,
    reportedReportTimestamp: report?.generatedAt ?? null,
    selectedCandidate: report && candidate && report.devices.some((d) => candidateKey(d) === candidateKey(candidate))
      ? {
        name: LIMIT(candidate.name, 105), class: LIMIT(candidate.deviceClass, 55),
        reportedStatus: LIMIT(candidate.windowsStatus, 35),
        configManagerErrorCode: candidate.configManagerErrorCode,
        reportedDiagnostic: candidate.diagnostic,
      } : null,
    operatorAssertions: {
      modelLabel: LIMIT(claims.modelLabel, 110),
      interfaceClaim: claims.interfaceClaim, broadcastClaim: claims.broadcastClaim,
      driverReference: LIMIT(claims.driverReference, 150),
      canAccessHardware: claims.canAccessHardware,
      rightsAcknowledged: claims.rightsAcknowledged,
    },
    evaluation, provenance: 'UNVERIFIED_IMPORT_PLUS_UNVERIFIED_OPERATOR_ASSERTIONS',
    disclaimer: 'Not proof of device identity, compatible drivers, RF lock, reception, decoded video or playback authorization. Never use this packet as automatic approval for device commands.',
  }, null, 2)
}
