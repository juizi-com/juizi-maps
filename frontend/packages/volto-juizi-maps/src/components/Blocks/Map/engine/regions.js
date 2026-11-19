/**
 * Which country or South African province each place is in, worked out from
 * its location and the Natural Earth shapes (src/data/geo.json), so editors
 * never pick a region by hand.
 *
 * The shapes are simplified, so a pin on a small island or right on a coast
 * can fall just outside every shape. Then the nearest shape within about
 * 150 km counts (Mauritius, Seychelles).
 */

function inRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

const polygons = (g) =>
  g.type === 'Polygon' ? [g.coordinates] : g.coordinates || [];

const inShape = (pt, g) =>
  polygons(g).some(
    (poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h)),
  );

// Rough distance in degrees from a point to a shape's nearest vertex.
const nearestVertex = (pt, g) => {
  let best = Infinity;
  polygons(g).forEach((poly) =>
    poly[0].forEach(([x, y]) => {
      const d = Math.hypot(x - pt[0], y - pt[1]);
      if (d < best) best = d;
    }),
  );
  return best;
};

const NEAR_ENOUGH = 1.4; // degrees, roughly 150 km

export const regionKey = (regionSet) =>
  regionSet === 'provinces' ? 'name' : 'iso';

/** The region a place is in, as { key, name }, or null. */
export function regionOf(place, geo, regionSet) {
  const src = regionSet === 'provinces' ? geo.provinces : geo.countries;
  const key = regionKey(regionSet);
  const pt = [place.lng, place.lat];
  let f = src.features.find((x) => inShape(pt, x.geometry));
  if (!f) {
    let best = NEAR_ENOUGH;
    src.features.forEach((x) => {
      const d = nearestVertex(pt, x.geometry);
      if (d < best) {
        best = d;
        f = x;
      }
    });
  }
  return f ? { key: f.properties[key], name: f.properties.name } : null;
}

/** Totals per region: { key: { name, total, places } }. */
export function regionTotals(places, geo, regionSet) {
  const out = {};
  places.forEach((p) => {
    const r = regionOf(p, geo, regionSet);
    if (!r) return;
    out[r.key] = out[r.key] || { name: r.name, total: 0, places: [] };
    out[r.key].total += p.number || 0;
    out[r.key].places.push(p);
  });
  return out;
}

export function regionFeatures(geo, regionSet, info) {
  const src = regionSet === 'provinces' ? geo.provinces : geo.countries;
  const key = regionKey(regionSet);
  return {
    type: 'FeatureCollection',
    features: src.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        key: f.properties[key],
        // A region with places but no numbers still shows as shaded.
        total: info[f.properties[key]]
          ? Math.max(info[f.properties[key]].total, 1)
          : 0,
      },
    })),
  };
}

// A region smaller than this (bounding box, square degrees, about 2° x 2°)
// can't be seen at country zoom, so it also gets a dot: Mauritius,
// Seychelles, Eswatini at world scale.
const TINY = 4;

const bboxArea = (g) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  polygons(g).forEach((poly) =>
    poly[0].forEach(([x, y]) => {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }),
  );
  return (x1 - x0) * (y1 - y0);
};

/** Dots for shaded regions too small to see, at their places' middle, and
 * for places outside every region (a point at sea, a country missing from
 * the shapes), so no place silently disappears from a shaded map. */
export function tinyRegionDots(geo, regionSet, info, places = []) {
  const src = regionSet === 'provinces' ? geo.provinces : geo.countries;
  const key = regionKey(regionSet);
  const features = [];
  src.features.forEach((f) => {
    const r = info[f.properties[key]];
    if (!r || !r.places.length || bboxArea(f.geometry) >= TINY) return;
    const lng = r.places.reduce((a, p) => a + p.lng, 0) / r.places.length;
    const lat = r.places.reduce((a, p) => a + p.lat, 0) / r.places.length;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        key: f.properties[key],
        name: f.properties.name,
        total: Math.max(r.total, 1),
      },
    });
  });
  places
    .filter((p) => !regionOf(p, geo, regionSet))
    .forEach((p) =>
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: {
          key: `place:${p.id}`,
          name: p.place,
          total: Math.max(p.number || 0, 1),
        },
      }),
    );
  return { type: 'FeatureCollection', features };
}
