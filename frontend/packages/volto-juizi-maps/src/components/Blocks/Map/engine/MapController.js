/**
 * Drives one MapLibre map: its style (street map recoloured to the site, the
 * standard street map, or the simple outline), the pins and groups (HTML
 * markers), shaded regions and pop-ups.
 *
 * Ported from the design mockup (~/plone-projects/maplibre/mockup.js). It
 * only runs in the browser: the block creates it in an effect, after
 * loading maplibre-gl.
 *
 * `opts` (see View.jsx `mapOptions`):
 *   displayMode   pins | totals | regions | contact
 *   regionSet     countries | provinces
 *   regionPins, cluster, highlight   booleans
 *   mapLook       branded | street | outline
 *   mapTone       light | tinted | dark
 *   labels        all | nostreets | major | none
 *   maxZoom       number
 *   pinShape      pin | dot | badge
 *   pinColour, mainColour           hex
 *   siteColours   hex[] (for "The site's colours" groups)
 *   groupColours  shades | site
 *   popupStyle    card | band | compact
 *   itemLimit     number
 *   directions    google | openstreetmap
 *   strings       visitor-facing text, already translated
 *   onNavigate(href)   follow an internal link without reloading the page
 *   onSelect(id|null)  a place's pop-up opened or closed
 */
import { contrast, INK, isDark, mix, toneColours } from './colour';
import {
  commonLabel,
  directionsHref,
  formatNumber as fmt,
  groupBreaks,
  groupTier,
  isExternal,
  telHref,
  whatsappHref,
} from './places';
import { regionTotals, regionFeatures, tinyRegionDots } from './regions';

const STREET_LABELS =
  /^(highway-name|highway-shield|road_shield|road_one_way|poi_|airport)/;
const SMALL_PLACES =
  /^(label_village|label_town|label_other|water_name|waterway_line_label)/;
const TILES = 'https://tiles.openfreemap.org/styles/';
const styleCache = {};

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  });
  kids.forEach((k) => k != null && n.append(k));
  return n;
};

const lines = (s) =>
  String(s || '')
    .split('\n')
    .filter((l) => l.trim())
    .flatMap((l, i) => (i ? [el('br'), l] : [l]));

const TEARDROP = (c, w, h, hole) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 30 40" aria-hidden="true" focusable="false"><path fill="${c}" stroke="#fff" stroke-width="2" d="M15 1C7.3 1 1 7.1 1 14.7 1 25 15 39 15 39s14-14 14-24.3C29 7.1 22.7 1 15 1Z"/><circle cx="15" cy="14.5" r="${hole ? 5 : 0}" fill="#fff"/></svg>`;

export default class MapController {
  constructor(ml, container, places, opts, geo) {
    this.ml = ml;
    this.container = container;
    this.places = places;
    this.opts = opts;
    this.geo = geo;
    this.markerCache = {};
    this.onScreen = {};
    this.popup = null;
    this.destroyed = false;
    this.styleKey = null;
  }

  /* ---------- Settings ---------- */

  get totals() {
    return this.opts.displayMode === 'totals';
  }

  get shown() {
    return this.places.filter((p) => p.hasLocation);
  }

  tone() {
    return toneColours(this.opts.mapTone, this.opts.mainColour);
  }

  /** Settings that need the map style rebuilt when they change. */
  styleKeyFor(opts) {
    return JSON.stringify([
      opts.mapLook,
      opts.mapTone,
      opts.labels,
      opts.displayMode,
      opts.regionSet,
      opts.highlight,
      opts.cluster,
      opts.mainColour,
      opts.pinColour,
      !!this.geo,
    ]);
  }

  /* ---------- Data for the map ---------- */

  pinsGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: this.shown.map((p) => ({
        type: 'Feature',
        properties: { id: p.id, number: p.number || 0 },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      })),
    };
  }

  regionInfo() {
    return this.geo
      ? regionTotals(this.shown, this.geo, this.opts.regionSet)
      : {};
  }

  ourLayers() {
    const t = this.tone();
    const { pinColour, mapLook, mapTone, displayMode, highlight } = this.opts;
    const info = this.regionInfo();
    const max = Math.max(1, ...Object.values(info).map((r) => r.total));
    const low = mix(t.land, pinColour, 0.25);
    const high =
      mapTone === 'dark'
        ? mix(pinColour, '#ffffff', 0.2)
        : mix(pinColour, '#000000', 0.25);
    const shaded = displayMode === 'regions';
    const sources = {
      pins: {
        type: 'geojson',
        data: this.pinsGeoJSON(),
        cluster: !!this.opts.cluster && displayMode !== 'contact',
        clusterRadius: 48,
        clusterMaxZoom: 9,
        clusterProperties: { total: ['+', ['get', 'number']] },
      },
    };
    const layers = [];
    if (this.geo) {
      sources.regions = {
        type: 'geojson',
        data: regionFeatures(this.geo, this.opts.regionSet, info),
      };
      if (shaded) {
        layers.push({
          id: 'regions-fill',
          type: 'fill',
          source: 'regions',
          filter: ['>', ['get', 'total'], 0],
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'total'],
              1,
              low,
              max === 1 ? 2 : max,
              high,
            ],
            'fill-opacity': mapLook === 'outline' ? 1 : 0.75,
          },
        });
        layers.push({
          id: 'regions-edge',
          type: 'line',
          source: 'regions',
          filter: ['>', ['get', 'total'], 0],
          paint: { 'line-color': '#ffffff', 'line-width': 1 },
        });
        sources['regions-dots'] = {
          type: 'geojson',
          data: tinyRegionDots(this.geo, this.opts.regionSet, info, this.shown),
        };
        layers.push({
          id: 'regions-dot',
          type: 'circle',
          source: 'regions-dots',
          paint: {
            'circle-radius': 7,
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'total'],
              1,
              low,
              max === 1 ? 2 : max,
              high,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
      } else if (highlight && mapLook !== 'street') {
        layers.push({
          id: 'regions-fill',
          type: 'fill',
          source: 'regions',
          filter: ['>', ['get', 'total'], 0],
          paint: {
            'fill-color': t.highlight,
            'fill-opacity': mapLook === 'outline' ? 1 : 0.55,
          },
        });
      }
    }
    // An invisible layer so the pin source loads; the pins are HTML.
    layers.push({
      id: 'pins-hit',
      type: 'circle',
      source: 'pins',
      paint: { 'circle-radius': 0, 'circle-opacity': 0 },
    });
    if (shaded) this.opts.onShade?.({ low, high, max });
    return { sources, layers, low, high, max };
  }

  outlineStyle() {
    const t = this.tone();
    const ours = this.ourLayers();
    const shaded = this.opts.displayMode === 'regions';
    return {
      version: 8,
      sources: {
        countries: { type: 'geojson', data: this.geo.countries },
        provinces: { type: 'geojson', data: this.geo.provinces },
        ...ours.sources,
      },
      layers: [
        {
          id: 'water',
          type: 'background',
          paint: { 'background-color': t.water },
        },
        {
          id: 'land',
          type: 'fill',
          source: 'countries',
          paint: { 'fill-color': t.land },
        },
        ...ours.layers.filter((l) => l.id.startsWith('regions')),
        {
          id: 'provinces-line',
          type: 'line',
          source: 'provinces',
          minzoom: shaded && this.opts.regionSet === 'provinces' ? 0 : 3.5,
          paint: {
            'line-color': t.border,
            'line-width': 0.6,
            'line-dasharray': [2, 2],
          },
        },
        {
          id: 'country-line',
          type: 'line',
          source: 'countries',
          paint: {
            'line-color': t.border,
            'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.5, 6, 1.4],
          },
        },
        ...ours.layers.filter((l) => !l.id.startsWith('regions')),
      ],
    };
  }

  async streetStyle(branded) {
    const url = TILES + (branded ? 'positron' : 'liberty');
    if (!styleCache[url]) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Street map style: ${res.status}`);
      styleCache[url] = await res.json();
    }
    const style = JSON.parse(JSON.stringify(styleCache[url]));
    if (branded) this.recolour(style);
    this.hideLabels(style);
    const ours = this.ourLayers();
    Object.assign(style.sources, ours.sources);
    // Region shading goes under the names: before the first symbol layer.
    const firstSymbol = style.layers.findIndex((l) => l.type === 'symbol');
    const regionLayers = ours.layers.filter((l) => l.id.startsWith('regions'));
    style.layers.splice(
      firstSymbol < 0 ? style.layers.length : firstSymbol,
      0,
      ...regionLayers,
    );
    style.layers.push(
      ...ours.layers.filter((l) => !l.id.startsWith('regions')),
    );
    return style;
  }

  hideLabels(style) {
    const { labels } = this.opts;
    style.layers.forEach((l) => {
      if (l.type !== 'symbol') return;
      const hide =
        labels === 'none' ||
        (labels !== 'all' && STREET_LABELS.test(l.id)) ||
        (labels === 'major' && SMALL_PLACES.test(l.id));
      if (hide) l.layout = { ...(l.layout || {}), visibility: 'none' };
    });
  }

  recolour(style) {
    const t = this.tone();
    const dark = this.opts.mapTone === 'dark';
    style.layers.forEach((l) => {
      const id = l.id;
      l.paint = l.paint || {};
      if (l.type === 'background') l.paint['background-color'] = t.land;
      else if (l.type === 'raster') l.paint['raster-opacity'] = 0;
      else if (l.type === 'fill') {
        if (/water|ocean|lake|river/.test(id)) l.paint['fill-color'] = t.water;
        else if (/building/.test(id)) {
          l.paint['fill-color'] = mix(
            t.land,
            dark ? '#000000' : t.border,
            0.25,
          );
        } else if (/park|landcover|landuse|wood|grass|green/.test(id)) {
          l.paint['fill-color'] = mix(t.land, t.highlight, 0.35);
        } else l.paint['fill-color'] = t.land;
        delete l.paint['fill-pattern'];
      } else if (l.type === 'line') {
        if (/water|river|stream/.test(id)) l.paint['line-color'] = t.water;
        else if (/boundary|admin/.test(id)) l.paint['line-color'] = t.border;
        else if (
          /road|highway|street|bridge|tunnel|path|rail|aeroway/.test(id)
        ) {
          l.paint['line-color'] = /casing/.test(id)
            ? mix(t.land, t.border, 0.5)
            : t.road;
        }
      } else if (l.type === 'symbol') {
        if (l.paint['text-color'] !== undefined || l.layout?.['text-field']) {
          l.paint['text-color'] = mix(t.text, t.land, 0.15);
          l.paint['text-halo-color'] = t.land;
        }
        if (l.paint['icon-opacity'] !== undefined || l.layout?.['icon-image']) {
          l.paint['icon-opacity'] = 0.5;
        }
      }
    });
  }

  async buildStyle() {
    const { mapLook } = this.opts;
    if (mapLook === 'outline' && this.geo) return this.outlineStyle();
    try {
      return await this.streetStyle(mapLook !== 'street');
    } catch (e) {
      // OpenFreeMap has no usage guarantee: fall back to the outline map.
      // eslint-disable-next-line no-console
      console.warn('Street map unavailable, using the outline map', e);
      if (!this.geo && this.loadGeo) this.geo = await this.loadGeo();
      return this.outlineStyle();
    }
  }

  /* ---------- Lifecycle ---------- */

  async start() {
    const style = await this.buildStyle();
    if (this.destroyed) return;
    const ml = this.ml;
    this.styleKey = this.styleKeyFor(this.opts);
    this.map = new ml.Map({
      container: this.container,
      style,
      center: [20, -10],
      zoom: 2,
      maxZoom: this.opts.maxZoom,
      cooperativeGestures: true,
      attributionControl: false,
      renderWorldCopies: false,
      locale: this.opts.strings.mapControls,
    });
    this.map.addControl(
      new ml.NavigationControl({ showCompass: false }),
      'top-right',
    );
    this.map.addControl(new ml.FullscreenControl(), 'top-right');
    this.map.addControl(
      new ml.AttributionControl({
        compact: true,
        customAttribution: this.geo ? 'Boundaries: Natural Earth' : undefined,
      }),
    );
    // On a phone-sized map the open credits cover the bottom of the map:
    // start them folded (the ⓘ opens them).
    if (this.container.clientWidth < 640) {
      this.map.once('load', () =>
        this.container
          .querySelector('.maplibregl-ctrl-attrib')
          ?.classList.remove('maplibregl-compact-show'),
      );
    }
    this.map.on('render', () => this.updateMarkers());
    // MapLibre only follows window resizes. The map's box also changes when
    // the page around it shifts (a cookie banner closing, fonts loading, a
    // sidebar opening), which left the map drawn in part of its box.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.map?.resize());
      this.resizeObserver.observe(this.container);
    }
    this.map.on('click', 'regions-fill', (e) => this.regionClick(e));
    this.map.on('click', 'regions-dot', (e) => this.regionClick(e));
    this.map.on('mousemove', (e) => {
      const hit =
        this.opts.displayMode === 'regions' &&
        this.map.getLayer('regions-fill') &&
        this.map.queryRenderedFeatures(e.point, {
          layers: ['regions-fill', 'regions-dot'].filter((l) =>
            this.map.getLayer(l),
          ),
        }).length;
      this.map.getCanvas().style.cursor = hit ? 'pointer' : '';
    });
    this.fit();
  }

  /** New places or settings from the editor (or a re-render). */
  async update(places, opts, geo) {
    const placesChanged = places !== this.places;
    this.places = places;
    const oldOpts = this.opts;
    this.opts = opts;
    if (geo) this.geo = geo;
    if (!this.map) return;
    if (oldOpts.maxZoom !== opts.maxZoom) this.map.setMaxZoom(opts.maxZoom);
    const key = this.styleKeyFor(opts);
    if (key !== this.styleKey) {
      this.styleKey = key;
      this.closePopup();
      this.clearMarkers();
      const style = await this.buildStyle();
      if (this.destroyed) return;
      this.map.setStyle(style, { diff: false });
      if (oldOpts.displayMode !== opts.displayMode) this.fit();
      return;
    }
    if (placesChanged) {
      this.map.getSource('pins')?.setData(this.pinsGeoJSON());
      if (this.geo && this.map.getSource('regions')) {
        this.map
          .getSource('regions')
          .setData(regionFeatures(this.geo, opts.regionSet, this.regionInfo()));
        this.map
          .getSource('regions-dots')
          ?.setData(
            tinyRegionDots(
              this.geo,
              opts.regionSet,
              this.regionInfo(),
              this.shown,
            ),
          );
      }
    }
    this.clearMarkers();
    if (this.popup?._placeId) {
      const p = this.places.find((x) => x.id === this.popup._placeId);
      if (p && p.hasLocation) this.popup.setDOMContent(this.placePopup(p));
      else this.closePopup();
    }
    this.map.triggerRepaint();
  }

  resize() {
    this.map?.resize();
  }

  destroy() {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.closePopup();
    this.clearMarkers();
    this.map?.remove();
    this.map = null;
  }

  fit() {
    if (!this.map) return;
    const pts = this.shown.map((p) => [p.lng, p.lat]);
    if (!pts.length) return;
    const b = pts.reduce(
      (bb, p) => bb.extend(p),
      new this.ml.LngLatBounds(pts[0], pts[0]),
    );
    // A contact map can go down to the street. A project map with one
    // place stays at country level, for context; with several, it zooms in
    // until they separate (20 schools in one township would otherwise sit
    // in a single group), never past the block's "Closest zoom".
    let closest = 15;
    if (this.opts.displayMode !== 'contact') closest = pts.length > 1 ? 12 : 6;
    const padding = Math.min(60, (this.container.clientHeight || 300) / 5);
    this.map.fitBounds(b, {
      padding,
      maxZoom: Math.min(closest, this.opts.maxZoom),
      duration: 0,
    });
  }

  /* ---------- Pins and groups ---------- */

  pinElement(p) {
    const c = this.opts.pinColour;
    const { pinShape } = this.opts;
    const totals = this.totals;
    const n = p.number || 0;
    const { strings } = this.opts;
    const label =
      p.number != null
        ? `${p.place}, ${fmt(p.number)} ${p.numberLabel}`.trim()
        : p.place;
    const b = el('button', {
      type: 'button',
      class: `jmap-pin jmap-pin--${pinShape}`,
      'aria-label': `${label}. ${strings.openDetails}`,
    });
    if (pinShape === 'pin') {
      const w = totals ? 34 : 28;
      const h = Math.round((w * 4) / 3);
      b.innerHTML = TEARDROP(c, w, h, !totals);
      if (totals) {
        b.append(
          el('span', {
            class: 'jmap-pin__label',
            text: fmt(n),
            style: `width:${w}px`,
          }),
        );
      }
    } else if (pinShape === 'dot') {
      const size = totals ? Math.round(26 + Math.sqrt(n) * 4) : 18;
      b.style.cssText = `width:${size}px;height:${size}px;background:${c}`;
      if (totals)
        b.append(el('span', { class: 'jmap-pin__label', text: fmt(n) }));
    } else {
      b.style.background = c;
      if (totals) {
        b.append(el('span', { class: 'jmap-pin__label', text: fmt(n) }));
        // With the total shown on the map, the pins carry just the number.
        if (p.numberLabel && !this.opts.hideUnit) {
          b.append(
            el('span', { class: 'jmap-pin__unit', text: p.numberLabel }),
          );
        }
      } else {
        b.append(el('span', { class: 'jmap-pin__label', text: p.place }));
      }
    }
    if (!isDark(c)) {
      b.querySelectorAll('.jmap-pin__label,.jmap-pin__unit').forEach((s) => {
        s.style.color = INK;
      });
    }
    return b;
  }

  groupColours() {
    const c = this.opts.pinColour;
    if (this.opts.groupColours === 'site' && this.opts.siteColours.length) {
      const list = this.opts.siteColours;
      const i = Math.max(0, list.indexOf(c));
      return [c, list[(i + 1) % list.length], list[(i + 2) % list.length]];
    }
    return this.opts.mapTone === 'dark'
      ? [mix(c, '#ffffff', 0.45), mix(c, '#ffffff', 0.15), c]
      : [mix(c, '#ffffff', 0.4), c, mix(c, '#000000', 0.4)];
  }

  clusterElement(props) {
    const { strings } = this.opts;
    const totals = this.totals;
    const value = totals ? props.total : props.point_count;
    const breaks = groupBreaks(this.shown, totals);
    const c = this.groupColours()[groupTier(value, breaks)];
    const size = Math.round(44 + Math.sqrt(value) * (totals ? 3 : 5));
    const label = totals
      ? strings.groupTotal(props.point_count, fmt(props.total))
      : strings.groupPlaces(props.point_count);
    const b = el('button', {
      type: 'button',
      class: 'jmap-pin jmap-pin--group',
      style: `width:${size}px;height:${size}px;background:${c}`,
      'aria-label': `${label}. ${strings.zoomIn}`,
    });
    const inner = el(
      'span',
      { class: 'jmap-pin__stack' },
      el('span', { class: 'jmap-pin__label', text: fmt(value) }),
    );
    if (size >= 50) {
      inner.append(
        el('span', {
          class: 'jmap-pin__sub',
          text: totals
            ? strings.placesCount(props.point_count)
            : strings.placesWord,
        }),
      );
    }
    b.append(inner);
    if (!isDark(c)) {
      b.querySelectorAll('.jmap-pin__label,.jmap-pin__sub').forEach((s) => {
        s.style.color = INK;
      });
    }
    return b;
  }

  clearMarkers() {
    Object.values(this.onScreen).forEach((m) => m.remove());
    this.onScreen = {};
    this.markerCache = {};
  }

  updateMarkers() {
    const map = this.map;
    if (!map || !map.getSource('pins') || !map.isSourceLoaded('pins')) return;
    const { displayMode, regionPins, pinShape } = this.opts;
    const showPins = displayMode !== 'regions' || regionPins;
    const next = {};
    if (showPins) {
      map.querySourceFeatures('pins').forEach((f) => {
        const p = f.properties;
        const key = p.cluster ? `c${p.cluster_id}` : `p${p.id}`;
        if (next[key]) return;
        let m = this.markerCache[key];
        if (!m) {
          if (p.cluster) {
            const g = this.clusterElement(p);
            g.addEventListener('click', (e) => {
              e.stopPropagation();
              this.zoomGroup(p.cluster_id, f.geometry.coordinates);
            });
            m = new this.ml.Marker({
              element: el('div', { class: 'jmap-pinwrap' }, g),
              anchor: 'center',
            }).setLngLat(f.geometry.coordinates);
          } else {
            const place = this.places.find((x) => x.id === p.id);
            if (!place) return;
            const b = this.pinElement(place);
            b.addEventListener('click', (e) => {
              e.stopPropagation();
              this.openPlace(place.id);
            });
            m = new this.ml.Marker({
              element: el('div', { class: 'jmap-pinwrap' }, b),
              anchor: pinShape === 'pin' ? 'bottom' : 'center',
            }).setLngLat([place.lng, place.lat]);
          }
          this.markerCache[key] = m;
        }
        next[key] = m;
        if (!this.onScreen[key]) m.addTo(map);
      });
    }
    Object.keys(this.onScreen).forEach((k) => {
      if (!next[k]) this.onScreen[k].remove();
    });
    this.onScreen = next;
  }

  async zoomGroup(id, center) {
    const z = await this.map.getSource('pins').getClusterExpansionZoom(id);
    this.map.easeTo({ center, zoom: Math.min(z, this.opts.maxZoom) });
  }

  /* ---------- Pop-ups ---------- */

  popupOffset() {
    const { displayMode, regionPins, pinShape } = this.opts;
    if (displayMode === 'regions' && !regionPins) return 0;
    if (pinShape === 'pin') {
      return {
        bottom: [0, -44],
        top: [0, 0],
        left: [16, -22],
        right: [-16, -22],
      };
    }
    return 20;
  }

  link(href, text, cls) {
    const external = isExternal(href);
    const a = el('a', { class: cls, href, text });
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(
        el('span', {
          class: 'jmap-sr-only',
          text: ` ${this.opts.strings.newTab}`,
        }),
      );
    } else if (this.opts.onNavigate) {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        this.opts.onNavigate(href);
      });
    }
    return a;
  }

  countLine(n, label) {
    return el(
      'p',
      { class: 'jmap-pop__count' },
      el('strong', { text: fmt(n) }),
      label || '',
    );
  }

  directionsLink(p, cls) {
    const { strings, directions } = this.opts;
    return el(
      'a',
      {
        class: cls,
        href: directionsHref(p, directions),
        target: '_blank',
        rel: 'noopener noreferrer',
        text: strings.directions,
      },
      el('span', { class: 'jmap-sr-only', text: ` ${strings.newTab}` }),
    );
  }

  contactRows(p, full) {
    const c = p.contact;
    const { strings } = this.opts;
    const out = [];
    if (c.address.trim()) {
      out.push(
        el('p', { class: 'jmap-contact__address' }, ...lines(c.address)),
      );
    }
    const dl = el('dl', { class: 'jmap-contact__rows' });
    if (c.phone.trim()) {
      dl.append(
        el('dt', { text: strings.phone }),
        el('dd', {}, el('a', { href: telHref(c.phone), text: c.phone })),
      );
    }
    if (c.phone2.trim()) {
      const wa = c.phone2Type === 'whatsapp';
      dl.append(
        el('dt', { text: strings.phone2[c.phone2Type] || strings.phone }),
        el(
          'dd',
          {},
          el('a', {
            href: wa ? whatsappHref(c.phone2) : telHref(c.phone2),
            text: c.phone2,
            ...(wa ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          }),
        ),
      );
    }
    if (c.email.trim()) {
      dl.append(
        el('dt', { text: strings.email }),
        el(
          'dd',
          {},
          el('a', { href: `mailto:${c.email.trim()}`, text: c.email }),
        ),
      );
    }
    if (full && c.hours.trim()) {
      dl.append(
        el('dt', { text: strings.hours }),
        el('dd', {}, ...lines(c.hours)),
      );
    }
    if (dl.children.length) out.push(dl);
    if (full && c.other.trim()) {
      out.push(
        el(
          'div',
          { class: 'jmap-contact__other' },
          ...c.other
            .split(/\n\s*\n/)
            .map((para) => el('p', {}, ...lines(para))),
        ),
      );
    }
    return out;
  }

  placePopup(p) {
    const { popupStyle, displayMode, itemLimit, pinColour, strings } =
      this.opts;
    const wrap = el('div', { class: 'jmap-pop' });
    const hasNumber = p.number != null;
    const heading = () => el('h3', { class: 'jmap-pop__place', text: p.place });
    if (popupStyle === 'compact') {
      const body = el('div', { class: 'jmap-pop__body' }, heading());
      if (hasNumber) body.append(this.countLine(p.number, p.numberLabel));
      if (p.contact.address.trim()) {
        body.append(
          el('p', { class: 'jmap-pop__addr' }, ...lines(p.contact.address)),
        );
      }
      if (displayMode === 'contact')
        body.append(this.directionsLink(p, 'jmap-pop__link'));
      if (p.linkHref && p.linkLabel) {
        body.append(
          this.link(p.linkHref, `${p.linkLabel} →`, 'jmap-pop__link'),
        );
      }
      wrap.append(body);
      return wrap;
    }
    if (p.image)
      wrap.append(el('img', { class: 'jmap-pop__img', src: p.image, alt: '' }));
    const body = el('div', { class: 'jmap-pop__body' });
    if (popupStyle === 'band') {
      const ink = isDark(pinColour) ? '#ffffff' : INK;
      const head = el(
        'div',
        {
          class: 'jmap-pop__head',
          style: `background:${pinColour};color:${ink}`,
        },
        heading(),
      );
      if (hasNumber) head.append(this.countLine(p.number, p.numberLabel));
      wrap.style.setProperty('--jmap-band-ink', ink);
      wrap.append(head);
    } else {
      body.append(heading());
      if (hasNumber) body.append(this.countLine(p.number, p.numberLabel));
    }
    if (p.summary)
      body.append(el('p', { class: 'jmap-pop__summary', text: p.summary }));
    if (p.figures.length) {
      body.append(
        el(
          'ul',
          { class: 'jmap-pop__figures' },
          ...p.figures.map((f) =>
            el('li', {}, el('b', { text: f.value }), ` ${f.label}`),
          ),
        ),
      );
    }
    if (p.items.length) {
      const item = (i) =>
        el('li', {}, i.href ? this.link(i.href, i.title) : i.title);
      const ul = el('ul', { class: 'jmap-pop__items' });
      p.items.slice(0, itemLimit).forEach((i) => ul.append(item(i)));
      if (p.items.length > itemLimit) {
        // "Show all" opens the rest of the list in the same pop-up.
        const more = el('li', { class: 'jmap-pop__more' });
        const btn = el('button', {
          type: 'button',
          class: 'jmap-pop__showall',
          text: strings.showAll(p.items.length),
        });
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const rest = p.items.slice(itemLimit).map(item);
          more.replaceWith(...rest);
          ul.classList.add('is-expanded');
          this.keepPopupInView();
          const a = rest[0].querySelector('a');
          if (a) a.focus();
          else {
            ul.tabIndex = -1;
            ul.focus();
          }
        });
        more.append(btn);
        ul.append(more);
      }
      body.append(ul);
    }
    if (p.hasContact) {
      const box = el(
        'div',
        { class: 'jmap-pop__contact' },
        ...this.contactRows(p, displayMode === 'contact'),
      );
      box.append(this.directionsLink(p, 'jmap-pop__directions'));
      body.append(box);
    }
    if (p.linkHref && p.linkLabel) {
      body.append(this.link(p.linkHref, p.linkLabel, 'jmap-pop__btn'));
    }
    wrap.append(body);
    return wrap;
  }

  regionPopup(name, info) {
    const label = commonLabel(info.places);
    if (info.places.length === 1) {
      const only = info.places[0];
      return this.placePopup({
        ...only,
        place: only.place === name ? name : `${name}: ${only.place}`,
      });
    }
    const wrap = el('div', { class: 'jmap-pop' });
    const body = el(
      'div',
      { class: 'jmap-pop__body' },
      el('h3', { class: 'jmap-pop__place', text: name }),
      this.countLine(info.total, label),
    );
    if (this.opts.popupStyle !== 'compact') {
      body.append(
        el(
          'ul',
          { class: 'jmap-pop__places' },
          ...info.places.map((p) =>
            el(
              'li',
              {},
              el('span', { text: p.place }),
              el('span', {
                text:
                  p.number != null ? `${fmt(p.number)} ${p.numberLabel}` : '',
              }),
            ),
          ),
        ),
      );
    }
    wrap.append(body);
    return wrap;
  }

  regionClick(e) {
    if (this.opts.displayMode !== 'regions') return;
    const f = e.features[0];
    const { key } = f.properties;
    if (String(key).startsWith('place:')) {
      this.openPlace(key.slice(6), false);
      return;
    }
    const info = this.regionInfo()[key];
    if (info)
      this.showPopup(e.lngLat, this.regionPopup(f.properties.name, info));
  }

  showPopup(lngLat, content) {
    this.closePopup();
    const compact = this.opts.popupStyle === 'compact';
    this.popup = new this.ml.Popup({
      offset: this.popupOffset(),
      maxWidth: compact ? '260px' : '320px',
      className: `jmap-popup jmap-popup--${this.opts.popupStyle}`,
      focusAfterOpen: true,
      closeButton: true,
    })
      .setLngLat(lngLat)
      .setDOMContent(content)
      .addTo(this.map);
    const closeBtn = this.popup
      .getElement()
      .querySelector('.maplibregl-popup-close-button');
    if (closeBtn) closeBtn.setAttribute('aria-label', this.opts.strings.close);
    const popup = this.popup;
    popup.on('close', () => {
      if (this.popup === popup) {
        this.popup = null;
        this.opts.onSelect?.(null);
      }
    });
    this.keepPopupInView();
  }

  closePopup() {
    if (this.popup) {
      const p = this.popup;
      this.popup = null;
      p.remove();
    }
  }

  /** Open a place's pop-up, flying to it when asked (from the list). */
  openPlace(id, fly = false) {
    const p = this.places.find((x) => x.id === id);
    if (!p || !p.hasLocation || !this.map) return;
    const show = () => {
      this.showPopup([p.lng, p.lat], this.placePopup(p));
      this.popup._placeId = p.id;
      this.opts.onSelect?.(p.id);
    };
    if (fly) {
      const zoom =
        this.opts.displayMode === 'contact'
          ? Math.max(this.map.getZoom(), Math.min(13, this.opts.maxZoom))
          : Math.max(this.map.getZoom(), Math.min(4, this.opts.maxZoom));
      this.map.flyTo({ center: [p.lng, p.lat], zoom });
      this.map.once('moveend', show);
    } else show();
  }

  // MapLibre picks the pop-up's side once and never pans to fit it, so a
  // long pop-up can run off the map. Pan just enough to show all of it.
  keepPopupInView() {
    const run = () =>
      requestAnimationFrame(() => {
        if (!this.popup || !this.map) return;
        const m = this.map.getContainer().getBoundingClientRect();
        const r = this.popup.getElement().getBoundingClientRect();
        const pad = 12;
        const bottomPad = 36; // room for the map credits line
        let dx = 0;
        let dy = 0;
        if (r.bottom > m.bottom - bottomPad)
          dy = r.bottom - m.bottom + bottomPad;
        if (r.top - dy < m.top + pad) dy = r.top - m.top - pad;
        if (r.right > m.right - pad) dx = r.right - m.right + pad;
        if (r.left - dx < m.left + pad) dx = r.left - m.left - pad;
        if (dx || dy) this.map.panBy([dx, dy], { duration: 300 });
      });
    if (this.map.isMoving()) this.map.once('moveend', run);
    else run();
  }
}

/** How well the pin colour shows on the chosen map colours (edit warning). */
export const pinContrast = (pinColour, mapTone, mainColour) =>
  contrast(pinColour, toneColours(mapTone, mainColour).land);
