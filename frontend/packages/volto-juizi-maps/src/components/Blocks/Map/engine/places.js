/**
 * Places as the map uses them: the block's saved places, cleaned up, with
 * numbers as numbers. Pure functions, safe on the server (the place list and
 * contact cards render there too).
 */
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const coord = (v) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

/** The href of a link field in any stored shape: object browser list,
 * single object, or plain string. '' when none. */
export const linkHref = (link) => {
  if (!link) return '';
  const first = Array.isArray(link) ? link[0] : link;
  if (!first) return '';
  const raw =
    typeof first === 'string' ? first : first['@id'] || first.url || '';
  if (!raw) return '';
  return /^(https?:|mailto:|tel:)/.test(raw) && !raw.includes('/++api++')
    ? raw
    : flattenToAppURL(raw);
};

export const isExternal = (href) =>
  /^(https?:)?\/\//.test(href || '') && !href.startsWith('/');

/** The image URL of an image field (object browser), at a scale. */
export const imageSrc = (image, scale = 'preview') => {
  const first = Array.isArray(image) ? image[0] : image;
  if (!first) return '';
  if (typeof first === 'string') return flattenToAppURL(first);
  const scales = first.image_scales?.image?.[0];
  const base = flattenToAppURL(first['@id'] || '');
  if (scales?.scales?.[scale]?.download) {
    return `${base}/${scales.scales[scale].download}`;
  }
  return base ? `${base}/@@images/image/${scale}` : '';
};

/** One saved place, ready to draw. `ok` is false while it's unfinished
 * (no name or no location): visitors don't see those. */
export const toPlace = (raw = {}, index = 0) => {
  const loc = raw.location || {};
  const lat = coord(loc.lat ?? raw.lat);
  const lng = coord(loc.lng ?? raw.lng);
  const place = String(raw.place || '').trim();
  const contact = {
    address: raw.contactAddress || '',
    phone: raw.contactPhone || '',
    phone2: raw.contactPhone2 || '',
    phone2Type: raw.contactPhone2Type || 'whatsapp',
    email: raw.contactEmail || '',
    hours: raw.contactHours || '',
    other: raw.contactOther || '',
  };
  return {
    id: raw['@id'] || `place-${index}`,
    place,
    lat,
    lng,
    hasLocation: lat !== null && lng !== null,
    ok: Boolean(place) && lat !== null && lng !== null,
    number: num(raw.number),
    numberLabel: String(raw.numberLabel || '').trim(),
    summary: String(raw.summary || '').trim(),
    figures: (raw.figures || [])
      .map((f) => ({
        id: f['@id'],
        label: String(f.label || '').trim(),
        value: String(f.value ?? '').trim(),
      }))
      .filter((f) => f.label || f.value),
    items: (raw.items || [])
      .map((i) => ({
        id: i['@id'],
        title: String(i.title || '').trim(),
        href: linkHref(i.link),
      }))
      .filter((i) => i.title),
    linkLabel: String(raw.linkLabel || '').trim(),
    linkHref: linkHref(raw.link),
    image: imageSrc(raw.image),
    contact,
    hasContact: Object.entries(contact).some(
      ([k, v]) => k !== 'phone2Type' && String(v).trim(),
    ),
  };
};

export const toPlaces = (list) => (list || []).map(toPlace);

const nice = (v) => {
  if (v <= 2) return 2;
  const e = 10 ** Math.floor(Math.log10(v));
  const f = v / e;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e;
};

/**
 * Where group sizes change colour. Worked out from the map's own numbers
 * (about a sixth and a third of the whole map, rounded to 2, 5, 10, 20...),
 * so editors never set them. With totals, a group's size is its total;
 * otherwise the number of places in it.
 */
export const groupBreaks = (places, totals) => {
  const whole = totals
    ? places.reduce((a, p) => a + (p.number || 0), 0)
    : places.length;
  const small = nice(whole / 6);
  const large = Math.max(nice(whole / 3), small * 2);
  return { small, large };
};

export const groupTier = (value, { small, large }) =>
  value < small ? 0 : value <= large ? 1 : 2;

/** en-GB number formatting, the same on the server and in every browser. */
export const formatNumber = (n) =>
  n == null || n === '' ? '' : Number(n).toLocaleString('en-GB');

/** The most common "what it counts" label, for keys and group labels. */
export const commonLabel = (places) => {
  const counts = {};
  places.forEach((p) => {
    if (p.numberLabel) counts[p.numberLabel] = (counts[p.numberLabel] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
};

export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;
export const whatsappHref = (phone) =>
  `https://wa.me/${String(phone).replace(/[^\d]/g, '')}`;

export const directionsHref = (place, provider = 'google') => {
  const lat = Number(place.lat).toFixed(5);
  const lng = Number(place.lng).toFixed(5);
  return provider === 'openstreetmap'
    ? `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};
