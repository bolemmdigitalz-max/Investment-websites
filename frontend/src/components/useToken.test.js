import { getPayload, isExpired } from './useToken';

const makeToken = (payload) => `header.${btoa(JSON.stringify(payload))}.signature`;

describe('getPayload', () => {
  it('decodes the JWT payload', () => {
    expect(getPayload(makeToken({ sub: 'root', exp: 123 }))).toEqual({ sub: 'root', exp: 123 });
  });

  it('returns null for malformed tokens', () => {
    expect(getPayload('garbage')).toBeNull();
    expect(getPayload('a.b.c')).toBeNull();
  });
});

describe('isExpired', () => {
  it('is false for a token that expires in the future', () => {
    const inOneHour = Math.floor(Date.now() / 1000) + 3600;
    expect(isExpired(makeToken({ exp: inOneHour }))).toBe(false);
  });

  it('is false for a token that expires in a few minutes', () => {
    const inFiveMinutes = Math.floor(Date.now() / 1000) + 300;
    expect(isExpired(makeToken({ exp: inFiveMinutes }))).toBe(false);
  });

  it('is true for a token that expired in the past', () => {
    const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
    expect(isExpired(makeToken({ exp: oneMinuteAgo }))).toBe(true);
  });

  it('is true when the token is malformed or has no exp claim', () => {
    expect(isExpired('nonsense')).toBe(true);
    expect(isExpired(makeToken({ sub: 'root' }))).toBe(true);
  });
});
