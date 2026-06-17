/**
 * validators.test.js — Unit tests for validateActivityEvent().
 *
 * validateActivityEvent should return true for valid events
 * and throw a descriptive Error for every invalid shape.
 */

import { describe, it, expect } from 'vitest';
import { validateActivityEvent } from '../src/core/validators.js';

function valid(overrides = {}) {
  return {
    category:  'Travel',
    subType:   'Petrol_Car',
    amount:    50,
    timestamp: '2025-03-10T09:00:00.000Z',
    ...overrides,
  };
}

describe('validateActivityEvent', () => {
  it('returns true for a fully valid event', () => {
    expect(validateActivityEvent(valid())).toBe(true);
  });

  it('accepts all seven valid categories', () => {
    const cats = ['Fossil', 'Fugitive', 'Electricity', 'Water', 'Waste', 'Travel', 'Offset'];
    cats.forEach((category) => {
      expect(() => validateActivityEvent(valid({ category }))).not.toThrow();
    });
  });

  it('throws when the event is null', () => {
    expect(() => validateActivityEvent(null)).toThrow(/valid object/);
  });

  it('throws when the event is a string', () => {
    expect(() => validateActivityEvent('bad')).toThrow(/valid object/);
  });

  it('throws for an unknown category', () => {
    expect(() => validateActivityEvent(valid({ category: 'Nuclear' }))).toThrow(/Invalid category/);
  });

  it('throws for an empty category', () => {
    expect(() => validateActivityEvent(valid({ category: '' }))).toThrow(/Invalid category/);
  });

  it('throws when subType is missing', () => {
    expect(() => validateActivityEvent(valid({ subType: undefined }))).toThrow(/subType/);
  });

  it('throws when subType is an empty string', () => {
    expect(() => validateActivityEvent(valid({ subType: '  ' }))).toThrow(/subType/);
  });

  it('throws when amount is a negative number', () => {
    expect(() => validateActivityEvent(valid({ amount: -1 }))).toThrow(/positive/);
  });

  it('throws when amount is NaN', () => {
    expect(() => validateActivityEvent(valid({ amount: NaN }))).toThrow(/positive/);
  });

  it('throws when amount is a string', () => {
    expect(() => validateActivityEvent(valid({ amount: '100' }))).toThrow(/positive/);
  });

  it('accepts 0 as a valid amount (boundary)', () => {
    // 0 amount is technically valid (user may still want to log a zero event)
    expect(() => validateActivityEvent(valid({ amount: 0 }))).not.toThrow();
  });

  it('throws when timestamp is missing', () => {
    expect(() => validateActivityEvent(valid({ timestamp: undefined }))).toThrow(/timestamp/);
  });

  it('throws when timestamp is not a valid ISO date', () => {
    expect(() => validateActivityEvent(valid({ timestamp: 'not-a-date' }))).toThrow(/timestamp/);
  });

  it('throws when timestamp is an empty string', () => {
    expect(() => validateActivityEvent(valid({ timestamp: '' }))).toThrow(/timestamp/);
  });

  it('accepts a valid ISO timestamp with timezone offset', () => {
    expect(() =>
      validateActivityEvent(valid({ timestamp: '2025-06-17T12:00:00+05:30' }))
    ).not.toThrow();
  });
});
