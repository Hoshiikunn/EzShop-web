import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDuration } from '@/utils/format';

describe('formatDateTime', () => {
  it('returns a dash for empty values', () => {
    expect(formatDateTime()).toBe('-');
    expect(formatDateTime('')).toBe('-');
  });

  it('formats a timestamp without 12-hour markers', () => {
    const result = formatDateTime('2026-10-27 14:30:00');

    expect(result).toMatch(/^2026\/10\/27/);
  });
});

describe('formatDuration', () => {
  it('formats remaining time', () => {
    expect(formatDuration(90_000)).toBe('00:01:30');
  });

  it('marks expired sessions', () => {
    expect(formatDuration(-1)).toBe('已过期');
  });
});
