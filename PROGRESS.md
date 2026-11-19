# Progress

Where the build stands, so work can resume after a pause. Decisions are
in [DECISIONS.md](DECISIONS.md); changes outside this repo (JET, its
juizi-blocks clone, p24) in `~/notes/juizi-maps/JET-CHANGES.md`.

## 2026-11-19 (overnight build, DECISIONS.md M0)

Done:
- [x] Repo (local git only, branch main) in cookieplone two-part layout.
- [x] Backend: settings record + `@juizi-maps-settings`, hidden until
      installed, uninstall profile, example pages profile. 20 tests pass.
- [x] Frontend: Map block (4 styles), location picker, place names in the
      sidebar list, Site Setup → Maps, dashboard tab utility, install
      offer. 27 unit tests pass, lint clean.
- [x] Vanilla dev site: backend :8098, frontend :3018, site `Plone`,
      admin/admin, examples under /maps. Checked in headless Chromium:
      all example pages, phone width (no sideways scroll), edit mode
      (start screen, sidebar, picker, paste box), settings page, one-style
      sites. No console errors.
- [x] JET (VLT 7.8.5): juizi.maps as a worktree (branch `jet-trial`) in
      the JET frontend, installed on jet2026 (p24), private test page
      `/map-block-test` with the Anglo American and Our work maps
      converted. Checked: maps, colours from juizi-blocks, Maps tab on the
      Juizi Blocks dashboard, VLT sidebar, start screen.
- [x] juizi-blocks (JET's clone, uncommitted): `juiziMap` block extension
      (site colours, Juizi group) and dashboard tabs from
      `juiziDashboardTab` utilities. Patch in ~/notes/juizi-maps.
- [x] READMEs (repo, backend, frontend, block with draft happy path and
      hesitation points), DECISIONS.md.

Next (after the morning review):
- [ ] Answers to the open questions at the end of DECISIONS.md
- [ ] First-time editor test by a person (the block README's happy path
      is a draft)
- [ ] GitHub repo, CI, then mx.ini/mrs-developer sources for JET and p24
- [ ] juizi-blocks side as its own branch + PR from main (plus D11: the
      backend validator accepting `juiziMap` colour narrowing)
- [ ] Keyboard pass on the map (pins are buttons; pop-ups trap focus?)
      and an axe run; not done yet
- [ ] Italian translations (the add-on has en only)
- [ ] Rebuild JET's live maps by hand once happy (15 mapLibreBlock maps
      on jet2026, listed in JET-CHANGES.md)

## Running it

```sh
cd backend && make start      # :8098
cd frontend && pnpm start     # :3018
```

After committing here, update JET's copy:
`git -C ~/juizi-sites/jet/frontend/packages/juizi.maps merge --ff-only main`.
