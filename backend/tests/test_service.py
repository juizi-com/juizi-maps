"""@juizi-maps-settings over HTTP."""

from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.restapi.testing import RelativeSession

import pytest
import transaction


@pytest.fixture
def portal_url(functional):
    return functional["portal"].absolute_url()


@pytest.fixture
def anon(portal_url):
    s = RelativeSession(portal_url)
    s.headers.update({"Accept": "application/json"})
    yield s
    s.close()


@pytest.fixture
def admin(portal_url):
    s = RelativeSession(portal_url)
    s.headers.update({"Accept": "application/json"})
    s.auth = (SITE_OWNER_NAME, SITE_OWNER_PASSWORD)
    yield s
    s.close()


@pytest.fixture
def editor(functional, portal_url):
    from plone.app.testing import setRoles
    from plone.app.testing import TEST_USER_ID
    from plone.app.testing import TEST_USER_NAME
    from plone.app.testing import TEST_USER_PASSWORD

    setRoles(functional["portal"], TEST_USER_ID, ["Editor"])
    transaction.commit()
    s = RelativeSession(portal_url)
    s.headers.update({"Accept": "application/json"})
    s.auth = (TEST_USER_NAME, TEST_USER_PASSWORD)
    yield s
    s.close()


def test_anyone_can_read(anon):
    r = anon.get("/@juizi-maps-settings")
    assert r.status_code == 200
    assert r.json()["directions"] == "google"


def test_admin_saves(admin, anon):
    r = admin.patch("/@juizi-maps-settings", json={"allowed_styles": ["pins", "contact"]})
    assert r.status_code == 200, r.text
    assert r.json()["allowed_styles"] == ["pins", "contact"]
    assert anon.get("/@juizi-maps-settings").json()["allowed_styles"] == ["pins", "contact"]


def test_bad_value_refused(admin):
    r = admin.patch("/@juizi-maps-settings", json={"allowed_styles": []})
    assert r.status_code == 400
    assert "at least one" in r.json()["error"]["message"]


def test_editor_cannot_save(editor):
    r = editor.patch("/@juizi-maps-settings", json={"directions": "openstreetmap"})
    assert r.status_code == 401


def test_anonymous_cannot_save(anon):
    r = anon.patch("/@juizi-maps-settings", json={"directions": "openstreetmap"})
    assert r.status_code == 401
