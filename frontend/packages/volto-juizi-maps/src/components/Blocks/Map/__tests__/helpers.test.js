import { parseCoordinates } from '../../../Widgets/LocationWidget';
import {
  commonLabel,
  directionsHref,
  groupBreaks,
  groupTier,
  linkHref,
  telHref,
  toPlace,
  whatsappHref,
} from '../engine/places';
import { getChangedData, withDefaults } from '../defaults';
import { regionTotals, tinyRegionDots } from '../engine/regions';
import { contrast, normaliseHex } from '../engine/colour';

describe('parseCoordinates', () => {
  it.each([
    ['-25.7461, 28.1881', { lat: -25.7461, lng: 28.1881 }],
    ['-25.7461 28.1881', { lat: -25.7461, lng: 28.1881 }],
    [
      'https://www.google.com/maps/place/Musina/@-22.3401,30.042,14z',
      { lat: -22.3401, lng: 30.042 },
    ],
    [
      'https://www.google.com/maps/place/x/data=!3d-26.2041!4d28.0473',
      { lat: -26.2041, lng: 28.0473 },
    ],
    ['https://maps.google.com/?q=-33.92,18.42', { lat: -33.92, lng: 18.42 }],
  ])('reads %s', (text, expected) => {
    expect(parseCoordinates(text)).toEqual(expected);
  });

  it.each(['', 'Pretoria', '95, 20', '10, 200'])('rejects %p', (text) => {
    expect(parseCoordinates(text)).toBeNull();
  });
});

describe('toPlace', () => {
  it('is unfinished without a name or a location', () => {
    expect(toPlace({ place: 'Kenya' }).ok).toBe(false);
    expect(toPlace({ location: { lat: 1, lng: 2 } }).ok).toBe(false);
    expect(toPlace({ place: 'Kenya', location: { lat: 1, lng: 2 } }).ok).toBe(
      true,
    );
  });

  it('reads numbers with spaces and commas', () => {
    expect(toPlace({ number: '1 200' }).number).toBe(1200);
    expect(toPlace({ number: '3,400' }).number).toBe(3400);
    expect(toPlace({ number: '' }).number).toBeNull();
    expect(toPlace({ number: 'lots' }).number).toBeNull();
  });

  it('drops empty figures and items', () => {
    const p = toPlace({
      figures: [
        { label: '', value: '' },
        { label: 'Schools', value: 4 },
      ],
      items: [{ title: '' }, { title: 'Report' }],
    });
    expect(p.figures).toHaveLength(1);
    expect(p.items).toHaveLength(1);
  });

  it('notices contact details, not the second phone type alone', () => {
    expect(toPlace({ contactPhone2Type: 'fax' }).hasContact).toBe(false);
    expect(toPlace({ contactEmail: 'a@b.org' }).hasContact).toBe(true);
  });
});

describe('links and phones', () => {
  it('reads every stored link shape', () => {
    expect(linkHref(undefined)).toBe('');
    expect(linkHref([])).toBe('');
    expect(linkHref('https://example.org')).toBe('https://example.org');
    expect(linkHref([{ '@id': 'https://example.org/a' }])).toBe(
      'https://example.org/a',
    );
  });

  it('cleans phone numbers', () => {
    expect(telHref('+27 11 000 0000')).toBe('tel:+27110000000');
    expect(whatsappHref('+27 82 000 0000')).toBe('https://wa.me/27820000000');
  });

  it('builds directions links', () => {
    const p = { lat: -26.2, lng: 28.04 };
    expect(directionsHref(p)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-26.20000,28.04000',
    );
    expect(directionsHref(p, 'openstreetmap')).toContain('openstreetmap.org');
  });
});

describe('group colours', () => {
  const places = [10, 20, 5, 15].map((number) => ({ number }));

  it('breaks at about a sixth and a third of the whole, rounded', () => {
    expect(groupBreaks(places, true)).toEqual({ small: 10, large: 20 });
    expect(groupBreaks(places, false)).toEqual({ small: 2, large: 4 });
  });

  it('puts sizes in tiers', () => {
    const b = { small: 10, large: 20 };
    expect([5, 10, 20, 21].map((v) => groupTier(v, b))).toEqual([0, 1, 1, 2]);
  });

  it('finds the most common label', () => {
    expect(
      commonLabel([
        { numberLabel: 'schools' },
        { numberLabel: 'schools' },
        { numberLabel: 'school' },
      ]),
    ).toBe('schools');
  });
});

describe('defaults', () => {
  it('fills settings the block has not saved', () => {
    const d = withDefaults({ displayMode: 'contact', labels: '' });
    expect(d.labels).toBe('all');
    expect(d.cluster).toBe(false);
    expect(withDefaults({ displayMode: 'totals' }).pinShape).toBe('badge');
  });

  it('saves the defaults that suit the first style chosen', () => {
    const d = getChangedData('displayMode', 'contact', { '@type': 'juiziMap' });
    expect(d).toMatchObject({ displayMode: 'contact', maxZoom: '18' });
  });

  it('switching style later keeps what the editor set', () => {
    const d = getChangedData('displayMode', 'pins', {
      displayMode: 'totals',
      height: 'large',
    });
    expect(d).toEqual({ displayMode: 'pins', height: 'large' });
  });

  it('leaving a contact map resets its close zoom and names', () => {
    const d = getChangedData('displayMode', 'totals', {
      displayMode: 'contact',
      maxZoom: '18',
      labels: 'all',
    });
    expect(d).toMatchObject({ maxZoom: '10', labels: 'nostreets' });
  });
});

describe('regions', () => {
  const square = (x, y, s) => ({
    type: 'Polygon',
    coordinates: [
      [
        [x, y],
        [x + s, y],
        [x + s, y + s],
        [x, y + s],
        [x, y],
      ],
    ],
  });
  const geo = {
    countries: {
      features: [
        { properties: { iso: 'BG', name: 'Big' }, geometry: square(0, 0, 10) },
        { properties: { iso: 'TI', name: 'Tiny' }, geometry: square(20, 0, 1) },
      ],
    },
  };
  const at = (id, lng, lat, number) => ({ id, place: id, lng, lat, number });

  it('adds up places per region, near misses included', () => {
    const totals = regionTotals(
      [at('a', 5, 5, 3), at('b', 6, 6, 4), at('c', 21.5, 1.5, 1)],
      geo,
      'countries',
    );
    expect(totals.BG.total).toBe(7);
    expect(totals.TI.total).toBe(1);
  });

  it('gives tiny regions and places outside every region a dot', () => {
    const places = [
      at('a', 5, 5, 3),
      at('t', 20.5, 0.5, 2),
      at('s', 50, 50, 1),
    ];
    const info = regionTotals(places, geo, 'countries');
    const keys = tinyRegionDots(geo, 'countries', info, places).features.map(
      (f) => f.properties.key,
    );
    expect(keys).toEqual(['TI', 'place:s']);
  });
});

describe('colour', () => {
  it('normalises hex', () => {
    expect(normaliseHex('#ABC')).toBe('#aabbcc');
  });
  it('measures contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});

describe('stackList', () => {
  const { stackList } = require('../engine/places');
  it('stacks when one name and count are long together', () => {
    expect(
      stackList([
        { place: 'Uthukela', number: 30 },
        {
          place: 'Mkhanyakude District Municipality',
          number: 34,
          numberLabel: 'primary schools',
        },
      ]),
    ).toBe(true);
  });
  it('keeps rows for short lines', () => {
    expect(
      stackList([
        { place: 'Rustenburg', number: 20, numberLabel: 'schools' },
        { place: 'Ga-Mampuru', number: 7, numberLabel: 'schools' },
      ]),
    ).toBe(false);
    expect(stackList([{ place: 'Ilembe District Municipality' }])).toBe(false);
  });
});

describe('sharedLabel and sumNumbers', () => {
  const { sharedLabel, sumNumbers } = require('../engine/places');
  const p = (number, numberLabel) => ({ number, numberLabel });
  it('finds one label shared by every counted place', () => {
    expect(
      sharedLabel([p(30, 'primary schools'), p(34, 'Primary Schools ')]),
    ).toBe('primary schools');
    expect(sharedLabel([p(30, 'schools'), { number: null }])).toBe('schools');
  });
  it('treats singular and plural as the same, and returns the plural', () => {
    expect(sharedLabel([p(1, 'project'), p(3, 'projects')])).toBe('projects');
  });
  it('is null when labels differ or one is missing', () => {
    expect(sharedLabel([p(30, 'schools'), p(4, 'teachers')])).toBe(null);
    expect(sharedLabel([p(30, 'schools'), p(4)])).toBe(null);
    expect(sharedLabel([])).toBe(null);
  });
  it('adds up the numbers', () => {
    expect(sumNumbers([p(30), p(34), { number: null }])).toBe(64);
  });
});

describe('labelColours', () => {
  const { labelColours, contrast } = require('../engine/colour');
  it('always gives at least 4.5:1 text', () => {
    ['#00958e', '#d9822b', '#ffffff', '#111111', '#d2232a', '#7fd6cf'].forEach(
      (c) => {
        const { fill, text } = labelColours(c);
        expect(contrast(fill, text)).toBeGreaterThanOrEqual(4.5);
      },
    );
  });
  it('keeps colours that already work', () => {
    expect(labelColours('#074946')).toEqual({
      fill: '#074946',
      text: '#ffffff',
    });
    expect(labelColours('#d9822b').fill).toBe('#d9822b');
  });
});
