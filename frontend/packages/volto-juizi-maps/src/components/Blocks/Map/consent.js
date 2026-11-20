/**
 * Cookie banner support (volto-gdpr-privacy with collective.volto.gdprcookie).
 *
 * The map's tiles and fonts come from tiles.openfreemap.org, so on a site
 * with the banner, visitors get the map only once they've agreed to it. The
 * add-on isn't a dependency: this reads what it leaves behind (its settings
 * in the page data, its Redux state, its cookie), and on a site without the
 * banner the map loads as usual.
 *
 * Which answer counts:
 * - The banner has a choice for the map (a reference URL matching
 *   openfreemap.org, or the key MAPS): the map follows that choice. A
 *   choice under "Technical cookies" is always on, so the map always shows.
 * - No such choice: the map follows the visitor's answer as a whole.
 *   "Only necessary cookies" (no optional choice accepted) keeps it off;
 *   accepting any optional choice shows it.
 * - No answer yet: no map.
 *
 * Editors always get the map (they need it to place pins).
 */
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import config from '@plone/volto/registry';

export const TILE_HOST = 'tiles.openfreemap.org';
const MAP_KEYS = ['MAPS'];

// Action names from volto-gdpr-privacy (actions/gdprPrivacyConsent.js).
const UPDATE = 'GDPR_PRIVACY_CONSENT_UPDATE';
const DISPLAY_BANNER = 'GDPR_PRIVACY_CONSENT_DISPLAY_BANNER';

const isEmpty = (o) => !o || Object.keys(o).length === 0;
const keysOf = (group) =>
  (group?.choices || []).map((c) => c?.config_key).filter(Boolean);

const matchesHost = (ref) => {
  const r = String(ref || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return !!r && (TILE_HOST === r || TILE_HOST.endsWith(`.${r}`));
};

/** The banner's choice for the map: { prefix, key, title } or null. */
export const findMapChoice = (panelConfig, locale = 'en') => {
  for (const [group, prefix] of [
    ['technical', 'tech_'],
    ['profiling', 'prof_'],
  ]) {
    const choice = (panelConfig?.[group]?.choices || []).find(
      (c) =>
        c?.config_key &&
        (MAP_KEYS.includes(c.config_key) ||
          (c.referenceUrls || []).some(matchesHost)),
    );
    if (choice) {
      const text = choice.text || {};
      const title =
        (text[locale] || text.en || Object.values(text)[0] || {}).title ||
        choice.config_key;
      return { prefix, key: choice.config_key, title };
    }
  }
  return null;
};

export const cookieName = (panelConfig) =>
  `${panelConfig?.cookie_version || 'vgdpr'}_accepted_providers`;

/** The keys accepted in the banner's cookie, or null if there's no cookie. */
export const readAccepted = (panelConfig, cookieString) => {
  const name = cookieName(panelConfig);
  const found = (cookieString || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (found === undefined) return null;
  let value = found.slice(name.length + 1);
  try {
    value = decodeURIComponent(value);
  } catch (e) {
    // keep it as it is
  }
  return value.split(',').filter(Boolean);
};

/**
 * 'none' (no banner on this site), 'allowed', or 'blocked'.
 * `preferences` is the add-on's Redux state ({ tech_X: true, prof_Y: false });
 * `accepted` the cookie's keys (null: no answer saved).
 */
export const consentState = ({ panelConfig, preferences, accepted }) => {
  if (isEmpty(panelConfig)) return 'none';
  const has = (k) =>
    !isEmpty(preferences) ? !!preferences[k] : !!accepted?.includes(k);
  const answered = !isEmpty(preferences) || accepted !== null;
  const choice = findMapChoice(panelConfig);
  if (choice) {
    if (choice.prefix === 'tech_') return 'allowed';
    return has(choice.prefix + choice.key) ? 'allowed' : 'blocked';
  }
  if (!answered) return 'blocked';
  const optional = keysOf(panelConfig.profiling);
  // A banner without optional choices only informs: nothing to refuse.
  if (!optional.length) return 'allowed';
  return optional.some((k) => has(`prof_${k}`)) ? 'allowed' : 'blocked';
};

const writeCookie = (panelConfig, keys) => {
  const days = Number(panelConfig?.cookie_expires) || 180;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = config.settings?.['volto-gdpr-privacy']?.domain;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${cookieName(panelConfig)}=${encodeURIComponent(keys.join(','))}` +
    `; expires=${expires}; path=/; SameSite=Lax` +
    (domain ? `; domain=${domain}` : '') +
    secure;
};

/**
 * { state, choice, allow, manage } for the map block. Call `state` only
 * after the first render in the browser (the server can't read the cookie).
 */
const useMapConsent = ({ isEditMode, locale }) => {
  const dispatch = useDispatch();
  const panelConfig = useSelector(
    (s) => s.content?.data?.['@components']?.['gdpr-cookie-settings'],
  );
  const preferences = useSelector((s) => s.gdprPrivacyConsent?.preferences);
  const bannerLoaded = useSelector((s) => s.gdprPrivacyConsent !== undefined);
  // "Show the map" without a map choice in the banner: this page view only.
  const [once, setOnce] = useState(false);

  const enabled = bannerLoaded && !isEmpty(panelConfig);
  const choice = enabled ? findMapChoice(panelConfig, locale) : null;
  let state = 'none';
  if (enabled && !isEditMode && !once && typeof document !== 'undefined') {
    state = consentState({
      panelConfig,
      preferences,
      accepted: readAccepted(panelConfig, document.cookie),
    });
  }

  const allow = useCallback(() => {
    if (!choice) {
      setOnce(true);
      return;
    }
    // As the banner's own "Enable … cookies" link: save the choice in the
    // cookie and in the add-on's state, keeping every other answer.
    const accepted = readAccepted(panelConfig, document.cookie) || [];
    const next = {};
    keysOf(panelConfig.technical).forEach((k) => (next[`tech_${k}`] = true));
    keysOf(panelConfig.profiling).forEach(
      (k) =>
        (next[`prof_${k}`] = !isEmpty(preferences)
          ? !!preferences[`prof_${k}`]
          : accepted.includes(`prof_${k}`)),
    );
    next[choice.prefix + choice.key] = true;
    writeCookie(
      panelConfig,
      Object.keys(next).filter((k) => next[k]),
    );
    dispatch({ type: UPDATE, preferences: next });
  }, [choice, panelConfig, preferences, dispatch]);

  const manage = useCallback(
    () =>
      dispatch({ type: DISPLAY_BANNER, display: true, displaySettings: true }),
    [dispatch],
  );

  return { state, choice, allow, manage };
};

export default useMapConsent;
