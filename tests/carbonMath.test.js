/**
 * carbonMath.test.js — Unit tests for calculateEmissions().
 *
 * All tests are pure: no IndexedDB, no React, no network.
 * The emission data JSON is loaded directly from src/data/.
 */

import { describe, it, expect } from 'vitest';
import { calculateEmissions }    from '../src/core/carbonMath.js';
import emissionData2025          from '../src/data/emissionFactors.in.2025.json';

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeEvent(overrides = {}) {
  return {
    category:  'Travel',
    subType:   'Petrol_Car',
    amount:    100,
    timestamp: '2025-01-15T08:00:00.000Z',
    ...overrides,
  };
}

// ── calculateEmissions ───────────────────────────────────────────────────────

describe('calculateEmissions', () => {
  it('returns a valid ledger row for a known Travel subType', () => {
    const result = calculateEmissions(makeEvent(), emissionData2025);

    expect(result).toMatchObject({
      category: 'Travel',
      subType:  'Petrol_Car',
      amount:   100,
    });
    expect(typeof result.totalCO2e).toBe('number');
    expect(result.totalCO2e).toBeGreaterThan(0);
  });

  it('calculates CO2-e correctly for 100 km petrol car at factor 0.12', () => {
    // factor = 0.12, CO2 allocation = 0.98, GWP_CO2 = 1
    // CH4 allocation = 0.01, GWP_CH4 = 28
    // N2O allocation = 0.01, GWP_N2O = 265
    // baseline = 100 * 0.12 = 12
    // CO2  = 12 * 0.98 * 1   = 11.76
    // CH4  = 12 * 0.01 * 28  = 3.36
    // N2O  = 12 * 0.01 * 265 = 31.8
    // total = 11.76 + 3.36 + 31.8 = 46.92
    const result = calculateEmissions(makeEvent({ amount: 100 }), emissionData2025);
    expect(result.totalCO2e).toBeCloseTo(46.92, 2);
  });

  it('produces gas breakdown with only CO2, CH4, N2O, HFC keys', () => {
    const result = calculateEmissions(makeEvent(), emissionData2025);
    expect(Object.keys(result.breakdown).sort()).toEqual(['CO2', 'CH4', 'HFC', 'N2O']);
  });

  it('throws when category is Offset (must use sequestrationMath)', () => {
    expect(() =>
      calculateEmissions(makeEvent({ category: 'Offset', subType: 'Tree_Mature' }), emissionData2025)
    ).toThrow(/Offset/);
  });

  it('throws when subType is missing from the emission data', () => {
    expect(() =>
      calculateEmissions(makeEvent({ subType: 'NonExistent_Subtype' }), emissionData2025)
    ).toThrow(/Missing emission factor/);
  });

  it('calculates electricity emissions correctly', () => {
    const event = makeEvent({
      category: 'Electricity',
      subType:  'Indian_Grid',
      amount:   1, // 1 kWh
    });
    const result = calculateEmissions(event, emissionData2025);
    // factor=0.85, CO2 alloc=0.99, GWP CO2=1 → CO2_kg = 0.85*0.99 = 0.8415
    // CH4 alloc=0.002, GWP 28 → CH4_co2e = 0.85*0.002*28 = 0.0476
    // N2O alloc=0.008, GWP 265 → N2O_co2e = 0.85*0.008*265 = 1.802
    // total ≈ 0.8415 + 0.0476 + 1.802 = 2.691
    expect(result.totalCO2e).toBeCloseTo(2.691, 2);
  });

  it('returns 0 total for 0 amount', () => {
    const result = calculateEmissions(makeEvent({ amount: 0 }), emissionData2025);
    expect(result.totalCO2e).toBe(0);
  });

  it('includes the original timestamp in the output', () => {
    const ts = '2025-06-01T10:00:00.000Z';
    const result = calculateEmissions(makeEvent({ timestamp: ts }), emissionData2025);
    expect(result.timestamp).toBe(ts);
  });

  it('throws when emission data JSON is missing the Factors key', () => {
    expect(() =>
      calculateEmissions(makeEvent(), { GWP_100: { CO2: 1, CH4: 28, N2O: 265, HFC: 1000 } })
    ).toThrow();
  });

  it('throws when emission data JSON is missing GWP_100', () => {
    expect(() =>
      calculateEmissions(makeEvent(), { Factors: {} })
    ).toThrow(/GWP_100/);
  });
});
