# juizi.maps

A **Map** block for Plone 6 / Volto: places on a street map in the site's
colours, as pins, pins with totals, shaded countries or provinces, or
offices with their contact details.

- **Backend:** `juizi.maps` (Plone 6.1). One settings record for the whole
  site (which map styles editors may choose, where "Get directions"
  goes), the `@juizi-maps-settings` service, and example pages.
- **Frontend:** `volto-juizi-maps` (Volto 18). The Map block, its location
  picker, and Site Setup → Maps.

Replaces volto-juizi-maplibre-counting-block and the codesyntax
volto-maplibre-block it extended. Those stay as a public archive; maps
made with them are rebuilt by hand with this block. The design and every
decision behind it: `~/plone-projects/maplibre/README.md` (mockup) and
[DECISIONS.md](DECISIONS.md).

Status: first build, 2026-11-19. Local only (no GitHub repo yet), alpha.
See [PROGRESS.md](PROGRESS.md).

## What editors get

Choose a **display style** first:

| Style | For |
|---|---|
| Pins on a map | a pin per place; click for its details |
| Pins with totals | each pin shows a number ("16 schools"); nearby pins group and add up, groups coloured by size |
| Shaded regions | countries or South African provinces coloured by their total, darker is more; regions too small to see get a dot |
| Places with contact details | offices or venues: address, phones (a second one can be WhatsApp), email, hours, "Get directions", beside or under the map |

Then add places in the sidebar: a name, where it is (click the small map,
drag the pin, or paste coordinates or a Google Maps link), and what the
pop-up shows: a number, figures, a summary, a list of items (pages on the
site or plain text), a link, a picture, contact details.

Visitors always get the places as a list too (visible by default, or for
screen readers only), so nothing is only in the map.

Full editor documentation and the draft happy path:
[the block's README](frontend/packages/volto-juizi-maps/src/components/Blocks/Map/README.md).

## Works with

- **Plain Volto 18** (no Volto Light Theme, no juizi-blocks): tested on the
  vanilla dev site below.
- **Volto Light Theme**: tested on JET (VLT 7.8.5).
- **juizi-blocks**: optional. When installed, the map offers the site
  colours from Site Setup → Juizi Blocks, sits in the Juizi group of the
  block chooser, and its settings appear as a **Maps** tab on the Juizi
  Blocks dashboard. Neither add-on imports the other: juizi-blocks
  registers a `blockExtension` utility named `juiziMap`, juizi.maps
  registers a `juiziDashboardTab` utility. (The juizi-blocks side isn't in
  juizi-blocks main yet; see PROGRESS.md.)

Without juizi-blocks, a site sets its colours in its own add-on:

```js
config.blocks.blocksConfig.juiziMap.colours = [
  { value: '#00958e', label: 'Turquoise' },
  { value: 'var(--dark-turquoise)', label: 'Dark turquoise' },
];
```

Otherwise five standard colours are offered (`src/settings/colours.js`).
Pale colours (white, light grey) are never used as the map's main or
default pin colour, since they vanish on a light map.

## Map tiles and data

- Street maps: [OpenFreeMap](https://openfreemap.org) (free, no key, no
  cookies). "Street map in the site's colours" recolours its Positron
  style in the browser; the standard street map is its Liberty style.
- Country and province shapes: [Natural Earth](https://www.naturalearthdata.com)
  (public domain), simplified, bundled in `src/data/geo.json` (150 KB
  gzipped), loaded only by maps that need them.
- maplibre-gl 5.24.0, loaded only in the browser, after the page renders.

## Installation

Two parts, like every Juizi add-on with a backend:

1. Backend: add `juizi.maps` to the Plone backend (it's picked up by
   plone.autoinclude), then install **Juizi Maps** in Site Setup → Add-ons.
2. Frontend: add `volto-juizi-maps` to the Volto project's add-ons.

Until the backend add-on is installed on a site, Site Setup → Maps says
so, and Site Setup → Add-ons offers it (frontend-offers-install pattern).
On a backend shared by several sites, the add-on stays hidden on sites
that don't have it.

## Development

```sh
cd backend && make install && make create-site && make start   # :8098, site "Plone"
cd frontend && make install && pnpm start                        # :3018
```

Log in as admin/admin. Example pages are under `/maps` (from the
`juizi.maps:initial` profile that `create-site` runs).

Tests:

```sh
cd backend && .venv/bin/pytest          # 20 tests
cd frontend && CI=true pnpm test        # 27 tests
cd frontend && pnpm lint
```
