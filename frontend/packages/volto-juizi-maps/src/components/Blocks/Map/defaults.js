/**
 * Settings a map uses when the block hasn't saved them. The schema has no
 * defaults (Volto would merge schema defaults into saved blocks); the view
 * reads every setting through withDefaults instead, and the first choice of
 * a display style saves the defaults that suit it (getChangedData).
 */

export const STYLES = ['pins', 'totals', 'regions', 'contact'];

export const BASE_DEFAULTS = {
  regionSet: 'countries',
  regionPins: false,
  mapLook: 'branded',
  mapTone: 'tinted',
  labels: 'nostreets',
  height: 'medium',
  pinShape: 'badge',
  cluster: true,
  groupColours: 'shades',
  highlight: true,
  popupStyle: 'card',
  itemLimit: '5',
  showTotal: false,
  maxZoom: '10',
  listMode: 'visible',
  mobileMap: 'show',
};

// A contact page needs street names, a close zoom and no grouping.
export const CONTACT_DEFAULTS = {
  pinShape: 'pin',
  mapTone: 'light',
  labels: 'all',
  maxZoom: '18',
  cluster: false,
  highlight: false,
  popupStyle: 'compact',
};

export const STYLE_DEFAULTS = {
  pins: { pinShape: 'pin' },
  totals: { pinShape: 'badge' },
  regions: { regionPins: false },
  contact: CONTACT_DEFAULTS,
};

export const HEIGHTS = { small: 360, medium: 480, large: 600 };

export const withDefaults = (data = {}) => {
  const out = { ...BASE_DEFAULTS, ...(STYLE_DEFAULTS[data.displayMode] || {}) };
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
};

/**
 * The first time an editor picks a display style, save the settings that
 * suit it; switching between styles later changes only what the new style
 * needs (contact pages and project maps want different zoom and names).
 */
export const getChangedData = (id, value, data) => {
  if (id !== 'displayMode') return { ...data, [id]: value };
  const next = { ...data, displayMode: value };
  if (!data.displayMode) {
    return { ...BASE_DEFAULTS, ...(STYLE_DEFAULTS[value] || {}), ...next };
  }
  if (value === 'contact' && data.displayMode !== 'contact') {
    return { ...next, ...CONTACT_DEFAULTS };
  }
  if (data.displayMode === 'contact' && value !== 'contact') {
    return {
      ...next,
      labels: BASE_DEFAULTS.labels,
      maxZoom: BASE_DEFAULTS.maxZoom,
      mapTone: BASE_DEFAULTS.mapTone,
      cluster: true,
      highlight: true,
      popupStyle: 'card',
      pinShape: STYLE_DEFAULTS[value]?.pinShape || data.pinShape,
    };
  }
  return next;
};
