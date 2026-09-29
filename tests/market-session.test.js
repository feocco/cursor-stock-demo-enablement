import { describe, expect, it } from '@jest/globals';
import { getMarketSession } from '../frontend/utils/marketSession.js';

describe('getMarketSession', () => {
  it('marks weekday regular hours as open', () => {
    // Tuesday 2026-09-29 10:00 America/New_York (EDT, UTC-4)
    expect(getMarketSession(new Date('2026-09-29T14:00:00Z'))).toEqual({
      status: 'open',
      label: 'Market open',
    });
  });

  it('opens at 9:30 Eastern and treats 16:00 as after hours', () => {
    expect(getMarketSession(new Date('2026-09-29T13:30:00Z')).status).toBe('open');
    expect(getMarketSession(new Date('2026-09-29T13:29:00Z')).status).toBe('pre-market');
    expect(getMarketSession(new Date('2026-09-29T20:00:00Z')).status).toBe('after-hours');
  });

  it('marks pre-market and after-hours windows', () => {
    expect(getMarketSession(new Date('2026-09-29T12:00:00Z'))).toEqual({
      status: 'pre-market',
      label: 'Pre-market',
    });
    expect(getMarketSession(new Date('2026-09-29T21:00:00Z'))).toEqual({
      status: 'after-hours',
      label: 'After hours',
    });
  });

  it('closes overnight, at 20:00 Eastern, and on weekends', () => {
    expect(getMarketSession(new Date('2026-09-30T02:00:00Z')).status).toBe('closed');
    expect(getMarketSession(new Date('2026-09-30T00:00:00Z')).status).toBe('closed');
    expect(getMarketSession(new Date('2026-09-29T07:59:00Z')).status).toBe('closed');
    expect(getMarketSession(new Date('2026-09-26T16:00:00Z')).status).toBe('closed');
  });

  it('uses Eastern Time during standard time', () => {
    // Monday 2026-01-05 10:00 America/New_York (EST, UTC-5)
    expect(getMarketSession(new Date('2026-01-05T15:00:00Z')).status).toBe('open');
    expect(getMarketSession(new Date('2026-01-05T14:00:00Z')).status).toBe('pre-market');
  });
});
