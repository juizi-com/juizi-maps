import {
  consentState,
  cookieName,
  findMapChoice,
  readAccepted,
} from '../consent';

const banner = (extra = []) => ({
  cookie_version: 'v1',
  technical: { choices: [{ config_key: 'GANALYTICS' }] },
  profiling: {
    choices: [
      { config_key: 'YOUTUBE', referenceUrls: ['youtube.com'] },
      ...extra,
    ],
  },
});
const maps = {
  config_key: 'MAPS',
  referenceUrls: ['openfreemap.org'],
  text: { en: { title: 'Maps' } },
};

describe('findMapChoice', () => {
  it('matches the tile host or a parent domain', () => {
    expect(findMapChoice(banner([maps]))).toEqual({
      prefix: 'prof_',
      key: 'MAPS',
      title: 'Maps',
    });
    const c = {
      config_key: 'OFM',
      referenceUrls: ['https://tiles.openfreemap.org/x'],
    };
    expect(findMapChoice(banner([c])).key).toBe('OFM');
  });
  it('ignores look-alike domains', () => {
    const c = {
      config_key: 'X',
      referenceUrls: ['freemap.org', 'evilopenfreemap.org'],
    };
    expect(findMapChoice(banner([c]))).toBe(null);
  });
  it('finds a technical choice too', () => {
    const b = banner();
    b.technical.choices.push({ config_key: 'MAPS' });
    expect(findMapChoice(b).prefix).toBe('tech_');
  });
});

describe('readAccepted', () => {
  const b = banner();
  it('reads the versioned cookie', () => {
    expect(cookieName(b)).toBe('v1_accepted_providers');
    expect(
      readAccepted(b, 'a=1; v1_accepted_providers=tech_GANALYTICS%2Cprof_MAPS'),
    ).toEqual(['tech_GANALYTICS', 'prof_MAPS']);
  });
  it('returns null without the cookie, [] for an empty one', () => {
    expect(readAccepted(b, 'a=1')).toBe(null);
    expect(readAccepted(b, 'v1_accepted_providers=')).toEqual([]);
  });
});

describe('consentState', () => {
  it('is none without a banner', () => {
    expect(consentState({ panelConfig: {}, accepted: null })).toBe('none');
    expect(consentState({ panelConfig: undefined, accepted: null })).toBe(
      'none',
    );
  });
  it('follows the map choice', () => {
    const panelConfig = banner([maps]);
    expect(consentState({ panelConfig, accepted: null })).toBe('blocked');
    expect(consentState({ panelConfig, accepted: ['prof_YOUTUBE'] })).toBe(
      'blocked',
    );
    expect(consentState({ panelConfig, accepted: ['prof_MAPS'] })).toBe(
      'allowed',
    );
  });
  it('prefers the live answer over the cookie', () => {
    const panelConfig = banner([maps]);
    expect(
      consentState({
        panelConfig,
        preferences: { prof_MAPS: false },
        accepted: ['prof_MAPS'],
      }),
    ).toBe('blocked');
    expect(
      consentState({
        panelConfig,
        preferences: { prof_MAPS: true },
        accepted: null,
      }),
    ).toBe('allowed');
  });
  it('always allows a technical map choice', () => {
    const panelConfig = banner();
    panelConfig.technical.choices.push({ config_key: 'MAPS' });
    expect(consentState({ panelConfig, accepted: null })).toBe('allowed');
  });
  it('without a map choice, follows the answer as a whole', () => {
    const panelConfig = banner();
    expect(consentState({ panelConfig, accepted: null })).toBe('blocked');
    expect(consentState({ panelConfig, accepted: ['tech_GANALYTICS'] })).toBe(
      'blocked',
    );
    expect(consentState({ panelConfig, accepted: ['prof_YOUTUBE'] })).toBe(
      'allowed',
    );
  });
  it('allows once answered when the banner has no optional choices', () => {
    const panelConfig = { ...banner(), profiling: { choices: [] } };
    expect(consentState({ panelConfig, accepted: null })).toBe('blocked');
    expect(consentState({ panelConfig, accepted: [] })).toBe('allowed');
  });
});
