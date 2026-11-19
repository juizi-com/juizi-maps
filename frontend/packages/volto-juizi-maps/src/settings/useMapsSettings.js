import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMapsSettings } from './actions';
import { DEFAULT_SETTINGS } from './reducer';

/** The site's map settings. Loaded once per visit, in the browser: until
 * then (and on the server) the defaults apply, so the page hydrates the same. */
export default function useMapsSettings() {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.juiziMapsSettings);
  const loaded = state?.loaded;
  const loading = state?.loading;
  useEffect(() => {
    if (!loaded && !loading) dispatch(getMapsSettings());
  }, [loaded, loading, dispatch]);
  return state || { data: DEFAULT_SETTINGS, loaded: false };
}
