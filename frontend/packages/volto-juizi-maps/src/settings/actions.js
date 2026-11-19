export const GET_MAPS_SETTINGS = 'JUIZI_MAPS_GET_SETTINGS';
export const SAVE_MAPS_SETTINGS = 'JUIZI_MAPS_SAVE_SETTINGS';

// Through Volto's API middleware, so the logged-in user's token goes along.
export const getMapsSettings = () => ({
  type: GET_MAPS_SETTINGS,
  request: { op: 'get', path: '/@juizi-maps-settings' },
});

export const saveMapsSettings = (data) => ({
  type: SAVE_MAPS_SETTINGS,
  request: { op: 'patch', path: '/@juizi-maps-settings', data },
});
