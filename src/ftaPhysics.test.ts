import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, EXAMPLES, geoGeometry, resultReceipt, simulateTransponder, THRESHOLDS } from './ftaPhysics'

describe('deterministic educational RF budget', () => {
  it('calculates GEO visibility from location and orbital longitude', () => {
    const galaxy = geoGeometry(38, -121, -97)
    const eutelsat = geoGeometry(38, -121, 9)
    expect(galaxy).not.toBeNull()
    expect(galaxy!.elevationDeg).toBeGreaterThan(20)
    expect(eutelsat!.elevationDeg).toBeLessThan(0)
    expect(geoGeometry(98, -121, -97)).toBeNull()
  })
  it('cannot lock a satellite below the horizon even with huge dish gain', () => {
    const result = simulateTransponder(EXAMPLES[2], { ...DEFAULT_SETTINGS, dishDiameterM: 15 })
    expect(result.status).toBe('BELOW_HORIZON')
    expect(result.cnDb).toBeNull()
    expect(result.elevationDeg).toBeLessThan(0)
  })
  it('computes actual thermal noise rather than treating carrier dBW as C/N', () => {
    const result = simulateTransponder(EXAMPLES[0], DEFAULT_SETTINGS)
    expect(result.carrierDbw).toBeLessThan(-100)
    expect(result.noiseDbw).toBeLessThan(-100)
    expect(result.cnDb).toBeCloseTo(result.carrierDbw! - result.noiseDbw!, 9)
    expect(result.marginDb).toBeCloseTo(result.cnDb! - result.thresholdDb!, 9)
    expect(result.thresholdDb).toBe(THRESHOLDS['DVB-S:QPSK:3/4'])
    expect(result.status).not.toBe('INCOMPLETE')
  })
  it('never clamps negative margin and rain reduces margin exactly by rain dB', () => {
    const clear = simulateTransponder(EXAMPLES[0], DEFAULT_SETTINGS)
    const rain = simulateTransponder(EXAMPLES[0], { ...DEFAULT_SETTINGS, rainFadeDb: 35 })
    expect(rain.marginDb).toBeCloseTo(clear.marginDb! - 35, 8)
    expect(rain.marginDb).toBeLessThan(0)
    expect(rain.status).toBe('NO_MODEL_LOCK')
  })
  it('does not add random jitter and improves reception with bigger dishes', () => {
    const a = simulateTransponder(EXAMPLES[0], DEFAULT_SETTINGS)
    const again = simulateTransponder(EXAMPLES[0], DEFAULT_SETTINGS)
    const big = simulateTransponder(EXAMPLES[0], { ...DEFAULT_SETTINGS, dishDiameterM: 1.8 })
    expect(again).toEqual(a)
    expect(big.marginDb!).toBeGreaterThan(a.marginDb!)
  })
  it('refuses incomplete imported metadata instead of inventing EIRP or symbol rate', () => {
    const missing = { ...EXAMPLES[0], eirpDbw: null, symbolRateKSps: null, reportedStatus: 'LOCKED' }
    const result = simulateTransponder(missing, DEFAULT_SETTINGS)
    expect(result.status).toBe('INCOMPLETE')
    expect(result.marginDb).toBeNull()
  })
  it('rejects unsupported MODCODs and out-of-range settings', () => {
    expect(simulateTransponder({ ...EXAMPLES[0], constellation: '8PSK' }, DEFAULT_SETTINGS).status).toBe('INCOMPLETE')
    expect(simulateTransponder(EXAMPLES[0], { ...DEFAULT_SETTINGS, dishDiameterM: 0 }).status).toBe('INCOMPLETE')
  })
  it('receipt preserves assumed inputs, labels model-only lock and no hardware observations', () => {
    const result = simulateTransponder(EXAMPLES[0], DEFAULT_SETTINGS)
    const json = JSON.parse(resultReceipt(EXAMPLES[0], DEFAULT_SETTINGS, result)) as {
      result: { status: string }; disclosures: string[]; provenance: string
    }
    expect(json.result.status).toContain('SIMULATED')
    expect(json.provenance).toBe('ILLUSTRATIVE_FIXTURE')
    expect(json.disclosures.join(' ')).toContain('No actual RF measurement')
  })
})
