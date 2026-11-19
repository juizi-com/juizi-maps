/**
 * The interactive map. Browser only: maplibre-gl (and the country shapes,
 * when the map needs them) load after the page has rendered, so they're not
 * in the main bundle and the server never touches them.
 *
 * The parent passes a ref; `ref.current.openPlace(id)` opens a place's
 * pop-up (from the list or a contact card).
 */
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import MapController from './engine/MapController';

let geoPromise = null;
const loadGeo = () => {
  if (!geoPromise) {
    geoPromise = import(
      /* webpackChunkName: "juizi-maps-geo" */ '../../../data/geo.json'
    ).then((m) => m.default || m);
  }
  return geoPromise;
};

// The shapes are needed for the outline map, shading and highlighting.
const needsGeo = (opts) =>
  opts.mapLook === 'outline' ||
  opts.displayMode === 'regions' ||
  (opts.highlight &&
    opts.mapLook !== 'street' &&
    opts.displayMode !== 'contact');

const MapCanvas = forwardRef(({ places, opts, label, height, onFail }, ref) => {
  const box = useRef(null);
  const ctrl = useRef(null);
  const latest = useRef({ places, opts });
  latest.current = { places, opts };
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    openPlace: (id) => ctrl.current?.openPlace(id, true),
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mod] = await Promise.all([
          import(/* webpackChunkName: "maplibre-gl" */ 'maplibre-gl'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        const ml = mod.default || mod;
        const { places: p, opts: o } = latest.current;
        const geo = needsGeo(o) ? await loadGeo() : null;
        if (cancelled || !box.current) return;
        const c = new MapController(ml, box.current, p, o, geo);
        c.loadGeo = loadGeo;
        ctrl.current = c;
        await c.start();
        if (!cancelled) setReady(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Map failed to load', e);
        if (!cancelled) onFail?.();
      }
    })();
    return () => {
      cancelled = true;
      ctrl.current?.destroy();
      ctrl.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !ctrl.current) return;
    (async () => {
      const geo = needsGeo(opts) ? await loadGeo() : null;
      ctrl.current?.update(places, opts, geo);
    })();
  }, [places, opts, ready]);

  useEffect(() => {
    ctrl.current?.resize();
  }, [height]);

  return (
    <div
      ref={box}
      className="jmap__canvas"
      style={{ height }}
      role="region"
      aria-label={label}
    />
  );
});

MapCanvas.displayName = 'MapCanvas';

export default MapCanvas;
