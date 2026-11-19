from juizi.maps.settings import clean
from juizi.maps.settings import get_settings
from juizi.maps.settings import save_settings
from plone import api

import json
import pytest


class TestClean:
    def test_known_order_no_repeats(self):
        assert clean({"allowed_styles": ["contact", "pins", "pins"]}) == {
            "allowed_styles": ["pins", "contact"]
        }

    def test_at_least_one_style(self):
        with pytest.raises(ValueError, match="at least one"):
            clean({"allowed_styles": []})

    def test_unknown_style(self):
        with pytest.raises(ValueError, match="Unknown map style"):
            clean({"allowed_styles": ["pins", "heatmap"]})

    def test_directions(self):
        assert clean({"directions": "openstreetmap"}) == {
            "directions": "openstreetmap"
        }
        with pytest.raises(ValueError):
            clean({"directions": "bing"})

    def test_unknown_keys_dropped(self):
        assert clean({"something": 1}) == {}

    def test_not_an_object(self):
        with pytest.raises(ValueError):
            clean(["pins"])


class TestStored:
    def test_save_merges(self, portal):
        save_settings({"directions": "openstreetmap"})
        out = get_settings()
        assert out["directions"] == "openstreetmap"
        assert out["allowed_styles"] == ["pins", "totals", "regions", "contact"]

    def test_broken_record_gives_defaults(self, portal):
        api.portal.set_registry_record("juizi.maps.settings", "{not json")
        assert get_settings()["directions"] == "google"

    def test_bad_stored_values_give_defaults(self, portal):
        api.portal.set_registry_record(
            "juizi.maps.settings", json.dumps({"allowed_styles": []})
        )
        assert get_settings()["allowed_styles"] == [
            "pins",
            "totals",
            "regions",
            "contact",
        ]
