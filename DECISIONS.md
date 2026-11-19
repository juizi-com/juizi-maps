# Decisions

Judgement calls made building juizi.maps, for review. The product
decisions you made before the build (default look, pin colour, grouping,
"Show all", name, standalone add-on, the accepted defaults) are in
`~/plone-projects/maplibre/README.md` and aren't repeated here.

Each entry: what I chose, why, and the alternative. **Flagged** entries
are the ones most worth a look in the morning.

## M0. The mandate (2026-11-19 evening)

"Build this… a vanilla instance where this can be tested, and then add it
to JET as well, with updates to the site and Juizi Blocks there, but those
changes will only get committed when we're happy with everything… finish
this with your best decisions in a document for us to review."

So: juizi-maps commits are local only (no GitHub repo until you say).
Nothing in JET, its juizi-blocks clone or p24 is committed. Every change
there is listed, with how to undo it, in `~/notes/juizi-maps/JET-CHANGES.md`.

## Structure

**D1. Repo layout copied from juizi-aichatbot.** Cookieplone two-part
layout (backend/ + frontend/packages/volto-juizi-maps), Plone 6.1.5,
Volto 18.35.0 (JET's version), Python pinned to 3.12.
Why: same as our other two-part add-ons, CI and Makefiles already work.
Alternative: a fresh cookieplone run (same result, more renaming).

**D2. Settings: one JSON registry record, own service.**
`juizi.maps.settings` holds `{allowed_styles, directions}`;
`@juizi-maps-settings` reads and writes it with validation.
Why: matches juizi-blocks' settings, one request for the block, easy to
grow. Alternative: a plone.registry control panel with a field per
setting (Volto's generic control panel UI, less control over wording).

**D3. Only two site-wide settings.** Which styles editors may choose, and
where "Get directions" goes. Everything else is per block.
Why: you asked for all four styles on new sites, and per-map choices
(look, pins, height) differ by page. Alternative: site defaults for map
look and pin colour; easy to add to the same record later.

**D4. The settings GET is public.** Anyone who can view the site can read
them (they hold nothing private); only Managers can change them.
Why: the published block needs the directions setting for visitors.
Alternative: put the directions choice in each block (more editor work).

**D5. Example pages in a separate `initial` profile.** Installing the
add-on on a real site creates no content; `make create-site` adds `/maps`
with five example pages. The profile is hidden from Site Setup.
Why: the examples are for the dev site and screenshots only.

**D6. Two-part add-on recipe as in juizi.dashboard.** Hidden from Site
Setup → Add-ons until installed on that site; the frontend offers it.
Why: p24 hosts many sites; your earlier frontend-offers-install decision.

## Colours

**D7. Where colours come from, in order:** juizi-blocks' `juiziMap`
extension (site colours) → `config.blocks.blocksConfig.juiziMap.colours`
in the site's add-on → five standard colours. Looked up when the map
draws, so add-on order doesn't matter. Neither add-on imports the other.
Why: what you asked (standalone, overridable in index.ts, juizi-blocks
colours when present), with the same pattern as the shop and donations
extensions. Alternative: juizi.maps importing juizi-blocks helpers (ruled
out: it must work on plain Volto).

**D8. Colours saved as the site gives them** (`var(--turquoise)` or hex)
and turned into hex in the browser when the map draws. Why: a colour
changed in the dashboard updates every map. The map isn't server-rendered
anyway (D15).

**D9. Pale site colours are skipped** for the map's main colour, the
default pin colour and "the site's colours" for groups: anything with
contrast under 2.5 against white. Found on JET, whose list starts with
White: pins and groups came out white. An editor can still pick white as
the pin colour (the sidebar warns when a pin colour is hard to see).
Alternative: a "main map colour" setting per site.

**D10. Flagged. Maps tab on the Juizi Blocks dashboard *and* Site Setup →
Maps.** With juizi-blocks, the same settings panel shows in both places.
The tab saves itself (the dashboard's Save bar doesn't cover it).
Why: plain-Volto sites need Site Setup → Maps; you asked for a tab on the
dashboard. Alternative: hide the Site Setup entry when juizi-blocks is
installed (one place to look, but the entry then depends on another
add-on being present). Your call.

**D11. The colour narrowing in the Juizi Blocks dashboard isn't wired for
the map yet.** The map takes all site colours. Narrowing per block needs
`juiziMap` accepted by juizi-blocks' backend validator, which drops
unknown block keys. Left for when the juizi-blocks side goes into a PR.

## Pins, groups, shading

**D12. Flagged. Group colour breaks are automatic.** Smaller than about a
sixth of the whole map, up to a third, more than that; rounded to 2, 5,
10, 20… ("under 10 / 10 to 20 / over 20 schools" on the Anglo American
map). Groups measure their total on totals maps, their number of places
otherwise. Why: editors never set numbers they can't judge; the live JET
map's colour thresholds aren't in its block data (the counting block
colours every group the same, so the live colours come from somewhere
else; I couldn't find where). Alternative: editor-set breaks in Advanced.

**D13. Regions are worked out from each place's location**, never picked
by the editor. Point-in-polygon on the shapes; a place just off a coast
counts for the nearest shape within about 150 km.
Why: one less field, and no mismatch between pin and region.

**D14. Nothing silently disappears from a shaded map.** Regions too small
to see at country zoom (bounding box under about 2° × 2°: Mauritius,
Rwanda, Eswatini, Lesotho) also get a dot in their shade. A place outside
every shape gets its own dot that opens its pop-up (JET's Our work puts
Seychelles at sea, 470 km from Mahé). The key's top value is the highest
region total (it showed the sum of all places before I fixed it).

**D15. Shapes are Natural Earth, simplified.** Countries and South African
provinces, Douglas-Peucker at 0.04° (countries) and 0.02° (provinces),
small islands kept: 150 KB gzipped, down from 330 KB, no visible
difference at page width. Loaded only by maps that shade, outline or
highlight. Alternative: vector tiles with boundaries (needs a tile server).

**D16. "Label" is stored as `badge`.** Pin shapes are Pin / Dot / Label as
you named them; the stored value for Label is `badge`. Why: no saved
content yet, so it could still change if you'd rather they match.

## The editor

**D17. Defaults are applied, not saved in the schema.** The schema has no
defaults (Volto would merge them into saved blocks). The first display
style chosen saves the settings that suit it; moving into or out of the
contact style resets zoom, names, tone, grouping and pop-up style;
other switches keep what the editor set. Same pattern as juizi-blocks.

**D18. One offered style is chosen for the editor.** If Site Setup allows
only one style, a new map starts in it, instead of a start screen with one
option.

**D19. Flagged. No search by place name in "Where it is".** Editors click
the small map, drag the pin, type coordinates, or paste coordinates or a
Google Maps link. Why: a place search needs a geocoding service:
Nominatim (OpenStreetMap) is free but limits use (one request a second,
identifying header, no autocomplete), others need an account and key, and
each sends what editors type to a third party. Alternative: add Nominatim
search on Enter (not as-you-type) to the picker; it's maybe half a day.
This is the most likely first-time-editor stumble.

**D20. The picker's map exists only while its place is open.** Volto keeps
every place's fields in the page; browsers allow about 16 maps at once, so
20 places would break. Found testing the 7-place example.

**D21. Flagged. Place names in the sidebar list on plain Volto come from a
small wrapper** that renames core Volto's "Place #1" headings after
render. VLT's list widget already shows names (from the `title` the block
saves). Why: core Volto's list widget has no option for item titles.
Alternative: a copy of core's ObjectListWidget (more code to keep in step
with Volto). The wrapper finds nothing to change if a later Volto names
items itself.

**D22. Flagged. "What it counts" is per place.** Typing "schools" for each
of 20 places is repetitive. The key uses the most common label. Why:
mixed maps happen ("3 projects", "1 project"); singular and plural differ.
Alternative: a map-level label with an optional per-place override.

**D23. Contact details are on every place, not only on contact maps.** On
other styles they sit on a second tab of the place; contact maps show
them first. Why: a project office's address in its pop-up is useful.
Alternative: contact fields only on contact maps (simpler tab).

**D24. Items link through the object browser, or are plain text.** A
project list in a pop-up can point to pages on the site or just name
things (JET's Our work lists projects as text).

## Visitors

**D25. The map renders only in the browser; the list and contact cards
render on the server.** Search engines and screen readers get every place
from the HTML. If the map can't load, the list stays with a short note.

**D26. schema.org as microdata on the contact cards** (`Place`, address,
telephone, email, geo), not JSON-LD. Why: it's on the visible content, so
it can't drift from it.

**D27. "Get directions" goes to Google Maps by default** (OpenStreetMap as
the site-wide alternative). WhatsApp numbers link to wa.me.

**D28. Phone-sized maps start with the credits folded** (the ⓘ opens
them); open credits covered the bottom of a 360px-tall map. Credit links
keep MapLibre's look under any theme (VLT underlined them in teal).

**D29. Numbers formatted en-GB** (1,200), the same on the server and in
every browser, as in juizi-blocks.

## JET trial

**D30. JET gets juizi.maps as a git worktree** in
`frontend/packages/juizi.maps` (branch `jet-trial`), picked up by the
existing `packages/**/packages/*` workspace glob, like the juizi-blocks
checkout. Why: a symlink to the main checkout would let JET's pnpm install
overwrite the vanilla site's node_modules. Keep it current with
`git merge --ff-only main` inside the worktree.

**D31. p24 runs juizi.maps from an editable install** of the same worktree
(`--no-deps`, so no pinned version moves), not from mx.ini: mxdev can't
take a local path. A later mxdev/`make install` drops it; JET-CHANGES.md
has the reinstall line. Once the repo is on GitHub, it becomes a normal
mx.ini source.

**D32. JET's old maps aren't converted by the add-on** (your decision:
rebuild by hand). For comparison only, a private test page on jet2026
(`/map-block-test`, hidden from navigation) holds the Anglo American and
Our work maps converted by a one-off script, plus an empty map. The
script read "Primary Schools: 11, High Schools: 5" into figures and Our
work's project lines into items. Delete the page when the trial is over.

**D33. maplibre-gl 5.24.0 sits beside JET's 4.0.2** (used by the old
counting block) until the old blocks are removed.

## Open questions for the morning

1. D10: one place or two for the map settings when juizi-blocks is there?
2. D19: add a Nominatim place search to the picker?
3. D22: map-level "What it counts"?
4. D12: are automatic group breaks fine, or do you know where JET's live
   group colours come from?
5. GitHub: create `juizi-com/juizi-maps` (public?) so JET and p24 can use
   normal sources, and so the juizi-blocks side can go into a PR?
6. The juizi-blocks changes (map extension, dashboard tabs) sit in JET's
   clone on `fix/plain-url-images` with the 5 November work. When it's
   time, they go on their own branch from main as one PR
   (`~/notes/juizi-maps/juizi-blocks-maps.patch`).
