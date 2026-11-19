# Progress

Where the first build stands, so work can resume after a pause. Decisions
are in DECISIONS.md.

## 2026-11-19 (overnight build, see DECISIONS.md M0)

Done:
- [x] Repo from juizi-aichatbot's cookieplone layout, renamed (backend
      `juizi.maps`, frontend `volto-juizi-maps`). Local git only.
- [x] Backend: settings record + `@juizi-maps-settings` (GET/PATCH),
      hidden-until-installed, uninstall profile, example pages profile.
      20 tests pass (`cd backend && .venv/bin/pytest`).
- [x] Frontend: map block (4 styles), engine ported from the mockup,
      location picker, places list naming, settings page + panel,
      dashboard tab utility, install offer.
- [x] Vanilla instance runs: backend :8098 (`cd backend && make start`),
      frontend :3018 (`cd frontend && pnpm start`). Site `Plone`,
      admin/admin. Example pages under /maps.
- [x] Browser checks: all 5 example pages render, no console errors;
      edit mode start screen, sidebar, location picker.

Next:
- [ ] Frontend unit tests + lint
- [ ] juizi-blocks (JET's clone, uncommitted): blockExtension `juiziMap`
      (colours, group) and dashboard tabs from `juiziDashboardTab`
- [ ] JET: add juizi.maps to frontend (mrs-developer, local path) and p24
      backend (uncommitted), install on the JET site, test page
- [ ] VLT check (JET runs VLT 7.8.5)
- [ ] Phone width, keyboard, axe
- [ ] DECISIONS.md complete, README, block README with draft happy path
