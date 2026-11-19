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
