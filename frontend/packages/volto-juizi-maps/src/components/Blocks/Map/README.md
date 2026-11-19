# Map block (`juiziMap`)

Places on a map, in one of four display styles. Registered by
`volto-juizi-maps` (`src/index.ts`), group `common` on plain Volto, the
Juizi group when juizi-blocks is installed.

## Files

| File | What |
|---|---|
| `index.js` | block config: id, icon, `juiziSchema` (not `blockSchema`, so Volto never merges schema defaults into saved blocks) |
| `Edit.jsx` | `makeBlockEdit(View)` with `getChangedData` (first-choice defaults) and `normalizeData` (place name copied to `title` for VLT's list widget) |
| `View.jsx` | every state: start screen, empty prompt, unfinished places, map + key + list or contact cards; hook-free error-boundary wrapper |
| `MapCanvas.jsx` | the map; maplibre-gl and the shapes load only in the browser |
| `Lists.jsx` | the key, the list of places, the contact cards (schema.org `Place`); server-rendered |
| `engine/MapController.js` | everything MapLibre: styles, recolouring, markers, groups, shading, pop-ups |
| `engine/places.js`, `regions.js`, `colour.js` | pure helpers (unit-tested in `__tests__/`) |
| `defaults.js` | settings used when the block hasn't saved them, per style |
| `schema.js`, `messages.js` | the sidebar |
| `../../Widgets/LocationWidget.jsx` | "Where it is": small map, latitude/longitude, paste box |
| `../../Widgets/PlacesListWidget.jsx` | the site's list widget, with each place named after it (core Volto shows "Place #1") |

## Display styles

| Style (`displayMode`) | Saved defaults on first choice |
|---|---|
| Pins on a map (`pins`) | pin shape Pin |
| Pins with totals (`totals`) | pin shape Label, grouping on |
| Shaded regions (`regions`) | shade Countries, no pins on top |
| Places with contact details (`contact`) | Pin, light map, all names, zoom to Street, no grouping, small-label pop-ups |

Every style also gets: street map in the site's colours, tinted, no street
names, medium height, grouping on, shades of the pin colour, card pop-ups,
5 items before "Show all", closest zoom Town, list visible, map shown on
phones. Switching style later keeps what the editor set, except that
moving into or out of the contact style resets zoom, names, tone,
grouping and pop-up style to suit it.

Site Setup → Maps (or the Maps tab on the Juizi Blocks dashboard) can
limit which styles editors may choose. A map already using a style that's
no longer offered keeps it and says so in the sidebar. With only one style
offered, a new map starts in that style (with its defaults) and the
sidebar says it's the only one.

## The sidebar

1. **Display style**, alone until chosen (the canvas shows what each one
   gives). Shaded regions adds **Shade** (Countries / South African
   provinces) and **Show pins on top of the shading**.
2. **Places on the map**: the list of places. Each place has a **Place**
   tab (name, where it is, number and what it counts, short description,
   figures, projects or items, button text and link, picture) and a
   **Contact details** tab (address, phone, second number and what it is,
   email, opening hours, other details). On contact maps the contact
   fields come first, on one tab.
3. **How the map looks**: Map (site colours / standard / simple outline),
   Map colours (light / tinted / dark), Names on the map, Colour the
   countries or provinces that have places, Map height.
4. **Pins and pop-ups**: Pin shape (Pin / Dot / Label), Pin colour, Group
   pins that are close together, Group colours (shades of the pin colour /
   the site's colours), Pop-up style (card / card with a coloured top /
   small label), Items shown before "Show all".
5. **For visitors**: List of places under the map (show it / only for
   screen readers), On phones (show the map / hide it and show the list
   or the contact cards), Closest zoom for visitors.
6. **Advanced**: Extra style name.

Fields that don't apply to the current choice are hidden (no pin fields
on a shaded map without pins, no tone on the standard street map, and so
on).

## What visitors see

- The map, with zoom buttons, full screen, and Ctrl/⌘ + scroll to zoom
  (two fingers on touch) so the page still scrolls past it.
- A key: group colours with their size bands, or the shading range.
- The list of places (sorted by number, then name), each a button that
  opens its pop-up; screen readers also get each pop-up's content there.
- Contact maps: a card per place with schema.org markup, "Get directions"
  (Google Maps or OpenStreetMap, set per site), and "Show on the map".
  One place: card beside the map.
- Places without a name or location are left out; the editor sees them
  flagged.
- If the map can't load (no WebGL, tiles blocked), the list or cards
  still show, with a short message.

## Saved data

```json
{
  "@type": "juiziMap",
  "displayMode": "totals",
  "places": [
    {
      "@id": "…", "place": "Kuruman", "title": "Kuruman",
      "location": { "lat": -27.4629, "lng": 23.436 },
      "number": "16", "numberLabel": "schools",
      "figures": [{ "@id": "…", "label": "Primary schools", "value": "11" }],
      "items": [{ "@id": "…", "title": "…", "link": [ … ] }]
    }
  ],
  "mapLook": "branded", "mapTone": "tinted", "…": "…"
}
```

Region totals aren't saved: they're worked out from each place's location
when the map draws, so editors never pick a country by hand. A place
outside every shape (a pin at sea, a tiny island missing from the shapes)
gets its own dot on a shaded map.

No saved content to protect yet: this is a new block. The old
`mapLibreBlock` (codesyntax / juizi counting variation) isn't converted;
JET's maps are rebuilt by hand.

## Happy path (Draft, confirm in first-time editor test)

1. Add a **Map** block. The canvas lists the four styles.
2. In the sidebar, choose **Display style** → *Pins with totals*. The
   canvas says there are no places yet.
3. Open **Places on the map**, click **+ Place**.
4. Type the **Place name** ("Kuruman").
5. Under **Where it is**, click the small map near the town, or paste
   coordinates or a Google Maps link into the box. The pin appears on the
   page's map straight away.
6. Fill in **Number** ("16") and **What it counts** ("schools").
   Optional: figures, a short description, items, a button.
7. Repeat for the other places. Nearby pins group automatically; the key
   under the map explains the group colours.
8. Save. Check the pop-ups and the list under the map.

## Hesitation points found walking it as a first-time editor

Must fix: none found.

Should fix (or decide):
- **No search by place name** in "Where it is". An editor will try typing
  "Musina". Clicking a country-wide map isn't exact for small towns; the
  paste box is the precise route but needs a trip to Google Maps.
  Adding a search needs a geocoding service (see DECISIONS.md, D19).
- **"What it counts" per place**: on a map of 20 schools the editor types
  "schools" 20 times. A map-level default with a per-place override would
  be quicker.
- **Contact details tab on project maps**: useful (a project office's
  address in its pop-up), but an editor building a project map may wonder
  whether they have to fill it in.
- **Many optional pop-up fields** (summary, figures, items, button,
  picture) on one tab; the help texts say "Optional", but it's a long tab.
- **Group colours** names two choices without showing them; the key on
  the canvas shows the result, so the change is visible.

Nice to fix:
- Core Volto opens the last place in the list and collapses the others;
  with many places, finding one means scanning names (they show now,
  instead of "Place #1").
- The "Closest zoom" setting is under For visitors; editors looking for
  "zoom" may look under How the map looks first.

## Known issues

- A React warning ("changing an uncontrolled input to be controlled") on
  JET's edit page comes from a react-select field in JET/VLT, not this
  block: the vanilla site's edit page doesn't show it.
- Tiles and fonts come from tiles.openfreemap.org. If a site's Content
  Security Policy is strict, it needs allowing.
- The "street map in the site's colours" recolours OpenFreeMap's Positron
  style in the browser, picking layers by their ids (water, park,
  building, road…). If OpenFreeMap renames layers, the map still draws,
  but a renamed layer gets the plain land colour (renamed water would
  look like land). Worth a glance after OpenFreeMap style updates.
