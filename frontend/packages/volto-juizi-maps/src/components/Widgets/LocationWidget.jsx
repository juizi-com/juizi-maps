/**
 * "Where it is": a small street map in the sidebar to click or drag the pin
 * on, the latitude and longitude, and a box to paste coordinates or a Google
 * Maps link (for small towns and rural schools, where clicking isn't exact).
 *
 * Saves { lat, lng } as numbers. The editor's map always zooms right in and
 * shows every name, whatever the block lets visitors see.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import messages from '../Blocks/Map/messages';
import './location-widget.scss';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const inRange = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const round = (n) => Math.round(n * 1e6) / 1e6;

/** Coordinates from pasted text: "-25.73, 28.21", "-25.73 28.21", or a
 * Google Maps link (…/@-25.73,28.21,15z, ?q=-25.73,28.21, !3d-25.73!4d28.21).
 * Returns { lat, lng } or null. */
export const parseCoordinates = (text) => {
  const s = String(text || '').trim();
  if (!s) return null;
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const re of patterns) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (inRange(lat, lng)) return { lat: round(lat), lng: round(lng) };
    }
  }
  return null;
};

const LocationWidget = (props) => {
  const { id, value, onChange } = props;
  const intl = useIntl();
  const box = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const ml = useRef(null);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState(false);
  const lat = value?.lat ?? '';
  const lng = value?.lng ?? '';
  const has = inRange(Number(lat), Number(lng)) && lat !== '' && lng !== '';
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const set = (next) => latest.current.onChange(id, next);

  // The map exists only while this place is open in the sidebar: Volto keeps
  // every place's fields in the page, and a browser allows only about 16
  // maps (WebGL contexts) at once.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setVisible(entry.contentRect.width > 0 && entry.contentRect.height > 0);
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let gone = false;
    (async () => {
      const [mod] = await Promise.all([
        import(/* webpackChunkName: "maplibre-gl" */ 'maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl.css'),
      ]);
      if (gone || !box.current) return;
      const lib = mod.default || mod;
      ml.current = lib;
      const v = latest.current.value;
      const ok = v && inRange(Number(v.lat), Number(v.lng));
      const m = new lib.Map({
        container: box.current,
        style: STYLE,
        center: ok ? [Number(v.lng), Number(v.lat)] : [24, -29],
        zoom: ok ? 12 : 3.5,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      });
      m.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
      // Credits start folded on this small map (the ⓘ opens them).
      m.once('load', () => {
        box.current
          ?.querySelector('.maplibregl-ctrl-attrib')
          ?.classList.remove('maplibregl-compact-show');
      });
      m.on('click', (e) => {
        set({ lat: round(e.lngLat.lat), lng: round(e.lngLat.lng) });
      });
      map.current = m;
      if (ok) placeMarker(Number(v.lat), Number(v.lng), false);
    })();
    return () => {
      gone = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeMarker = (la, ln, fly) => {
    if (!map.current || !ml.current) return;
    if (!marker.current) {
      marker.current = new ml.current.Marker({ draggable: true })
        .setLngLat([ln, la])
        .addTo(map.current);
      marker.current.on('dragend', () => {
        const p = marker.current.getLngLat();
        set({ lat: round(p.lat), lng: round(p.lng) });
      });
    } else {
      marker.current.setLngLat([ln, la]);
    }
    if (fly) {
      map.current.flyTo({ center: [ln, la], zoom: Math.max(map.current.getZoom(), 12) });
    }
  };

  // Keep the pin where the value says (typing, pasting, undo).
  useEffect(() => {
    if (has) {
      const p = marker.current?.getLngLat();
      const moved = !p || Math.abs(p.lat - lat) > 1e-7 || Math.abs(p.lng - lng) > 1e-7;
      if (moved) placeMarker(Number(lat), Number(lng), !p || moved);
    } else if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  }, [lat, lng, has]); // eslint-disable-line react-hooks/exhaustive-deps

  const typed = (key) => (e) => {
    const raw = e.target.value.trim();
    const next = { lat: value?.lat ?? '', lng: value?.lng ?? '', [key]: raw === '' ? '' : Number(raw) };
    set(next.lat === '' && next.lng === '' ? undefined : next);
  };

  const onPaste = (text) => {
    setPaste(text);
    if (!text.trim()) {
      setPasteError(false);
      return;
    }
    const found = parseCoordinates(text);
    setPasteError(!found);
    if (found) {
      set(found);
      setPaste('');
    }
  };

  return (
    <FormFieldWrapper {...props} className="jmap-location">
      <div className="jmap-location__body">
        <div ref={box} className="jmap-location__map" />
        <p className="jmap-location__hint">{intl.formatMessage(messages.pickHint)}</p>
        <div className="jmap-location__coords">
          <label>
            <span>{intl.formatMessage(messages.latitude)}</span>
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={lat}
              onChange={typed('lat')}
            />
          </label>
          <label>
            <span>{intl.formatMessage(messages.longitude)}</span>
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={lng}
              onChange={typed('lng')}
            />
          </label>
        </div>
        <label className="jmap-location__paste">
          <span>{intl.formatMessage(messages.paste)}</span>
          <input
            type="text"
            value={paste}
            onChange={(e) => onPaste(e.target.value)}
            aria-invalid={pasteError || undefined}
            aria-describedby={pasteError ? `${id}-paste-error` : undefined}
          />
        </label>
        {pasteError && (
          <p id={`${id}-paste-error`} className="jmap-location__error" role="alert">
            {intl.formatMessage(messages.pasteBad)}
          </p>
        )}
        {has && (
          <button type="button" className="jmap-location__clear" onClick={() => set(undefined)}>
            {intl.formatMessage(messages.clearLocation)}
          </button>
        )}
      </div>
    </FormFieldWrapper>
  );
};

export default LocationWidget;
