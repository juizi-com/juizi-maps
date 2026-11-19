/**
 * Colour helpers for the map. The map draws in a canvas, so it needs real
 * hex colours: CSS variables (`var(--name)`, how juizi-blocks stores the
 * site colours) are read from the page in the browser.
 *
 * No window/document reads at import time: resolveColour only reads the page
 * when it's called, and the map only calls it in the browser.
 */

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

export const normaliseHex = (value) => {
  const v = String(value || '').trim();
  if (HEX6.test(v)) return v.toLowerCase();
  const m = HEX3.exec(v);
  if (m) {
    return `#${m[1]
      .split('')
      .map((c) => c + c)
      .join('')}`.toLowerCase();
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(v);
  if (rgb) {
    return `#${rgb
      .slice(1, 4)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
  }
  return null;
};

/** A stored colour as hex. `var(--name)` is read from the page; anything
 * unreadable gives `fallback`. */
export const resolveColour = (value, fallback = '#1f6f8b') => {
  const direct = normaliseHex(value);
  if (direct) return direct;
  const m = /^var\((--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)$/i.exec(
    String(value || '').trim(),
  );
  if (m && typeof document !== 'undefined') {
    const read = getComputedStyle(document.documentElement)
      .getPropertyValue(m[1])
      .trim();
    const hex = normaliseHex(read) || normaliseHex(m[2]);
    if (hex) return hex;
  }
  return fallback;
};

const hex = (h) =>
  normaliseHex(h)
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16));
const toHex = (rgb) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

/** a mixed towards b by t (0 = a, 1 = b). */
export const mix = (a, b, t) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

const luminance = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const isDark = (h) => luminance(h) < 0.4;

/** WCAG contrast ratio between two colours. */
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

export const INK = '#1d232b';

/**
 * The map's own colours for a tone, worked out from the site's main colour
 * (the first colour in the list). `light` keeps the land white, `tinted`
 * washes it with the main colour, `dark` uses a deep version of it.
 */
export const toneColours = (tone, main) => {
  const accent = main;
  const accentDark = mix(main, '#000000', 0.55);
  const wash = mix(main, '#ffffff', 0.93);
  if (tone === 'dark') {
    return {
      water: mix(accentDark, '#000000', 0.35),
      land: accentDark,
      border: mix(accentDark, '#ffffff', 0.25),
      highlight: mix(accentDark, accent, 0.55),
      text: '#e8f0ef',
      road: mix(accentDark, '#ffffff', 0.12),
    };
  }
  if (tone === 'tinted') {
    return {
      water: '#ffffff',
      land: mix(accent, '#ffffff', 0.86),
      border: mix(accent, '#ffffff', 0.45),
      highlight: mix(accent, '#ffffff', 0.62),
      text: INK,
      road: '#ffffff',
    };
  }
  return {
    water: wash,
    land: '#ffffff',
    border: '#c9cccc',
    highlight: mix(accent, '#ffffff', 0.78),
    text: INK,
    road: mix(wash, '#ffffff', 0.4),
  };
};
