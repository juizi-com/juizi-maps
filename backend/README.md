# juizi.maps (backend)

The Plone side of the Map block. See the [repository README](../README.md).

- Settings record `juizi.maps.settings` (JSON): which display styles
  editors may choose (`allowed_styles`) and where "Get directions" goes
  (`directions`: `google` or `openstreetmap`). Read through
  `juizi.maps.settings.get_settings()`, which always returns complete,
  valid settings.
- Service `@juizi-maps-settings` on the site root: GET for anyone who can
  view the site (the block needs it on public pages; it holds nothing
  private), PATCH for Managers, validated (400 with a message on bad input).
- Profiles: `default` (install), `uninstall`, and `initial` (example pages
  under `/maps`, for the dev site; never offered in Site Setup).
- Hidden from Site Setup → Add-ons until installed on that site (shared
  backends), offered by the frontend add-on instead.

The block's places are saved in the page's blocks like any Volto block;
the backend has no content types.

```sh
make install
make create-site    # site "Plone" with the example pages
make start          # localhost:8098
.venv/bin/pytest
```
