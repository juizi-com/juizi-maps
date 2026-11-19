import { GET_MAPS_SETTINGS, SAVE_MAPS_SETTINGS } from './actions';

// What the map uses until the site's settings arrive (and on sites where
// the backend add-on isn't installed: the request then fails and these stay).
export const DEFAULT_SETTINGS = {
  allowed_styles: ['pins', 'totals', 'regions', 'contact'],
  directions: 'google',
};

const initial = {
  data: DEFAULT_SETTINGS,
  loaded: false,
  loading: false,
  installed: null,
  saving: false,
  error: null,
};

export default function juiziMapsSettings(state = initial, action = {}) {
  switch (action.type) {
    case `${GET_MAPS_SETTINGS}_PENDING`:
      return { ...state, loading: true };
    case `${GET_MAPS_SETTINGS}_SUCCESS`:
      return {
        ...state,
        loading: false,
        loaded: true,
        installed: true,
        data: { ...DEFAULT_SETTINGS, ...action.result },
      };
    case `${GET_MAPS_SETTINGS}_FAIL`:
      return {
        ...state,
        loading: false,
        loaded: true,
        installed: action.error?.status === 404 ? false : state.installed,
      };
    case `${SAVE_MAPS_SETTINGS}_PENDING`:
      return { ...state, saving: true, error: null };
    case `${SAVE_MAPS_SETTINGS}_SUCCESS`:
      return {
        ...state,
        saving: false,
        data: { ...DEFAULT_SETTINGS, ...action.result },
      };
    case `${SAVE_MAPS_SETTINGS}_FAIL`:
      return {
        ...state,
        saving: false,
        error:
          action.error?.response?.body?.error?.message ||
          action.error?.message ||
          'error',
      };
    default:
      return state;
  }
}
