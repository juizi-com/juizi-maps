"""The site's map settings: defaults, reading and checking.

The record holds JSON. Reading always returns a complete, valid settings
dict (defaults fill anything missing or broken), so a hand-edited or older
record never breaks the maps. Saving goes through ``clean``, which keeps only
known keys and refuses values it doesn't understand."""

from juizi.maps.interfaces import IMapsSettings
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

import json


RECORD = "juizi.maps.settings"

# The display styles a map block can use, in the order editors see them.
STYLES = ("pins", "totals", "regions", "contact")

DIRECTIONS = ("google", "openstreetmap")

DEFAULTS = {
    # Styles editors may choose for new maps. A map already on a page keeps
    # its style even when it's no longer allowed.
    "allowed_styles": list(STYLES),
    # Where "Get directions" links go.
    "directions": "google",
}


def _record():
    registry = getUtility(IRegistry)
    return registry.forInterface(IMapsSettings, prefix="juizi.maps", check=False)


def get_settings():
    """The current settings, complete and valid."""
    raw = None
    try:
        raw = _record().settings
    except (KeyError, AttributeError):
        raw = None
    try:
        stored = json.loads(raw or "{}")
    except (TypeError, ValueError):
        stored = {}
    if not isinstance(stored, dict):
        stored = {}
    out = dict(DEFAULTS)
    try:
        out.update(clean({**DEFAULTS, **stored}))
    except ValueError:
        # A broken record falls back to the defaults rather than breaking maps.
        pass
    return out


def clean(data):
    """Check new settings. Returns the cleaned dict, or raises ValueError with
    a message an administrator can act on."""
    if not isinstance(data, dict):
        raise ValueError("The settings must be an object.")
    out = {}
    if "allowed_styles" in data:
        styles = data["allowed_styles"]
        if not isinstance(styles, list) or not all(isinstance(s, str) for s in styles):
            raise ValueError("Allowed styles must be a list of style names.")
        unknown = [s for s in styles if s not in STYLES]
        if unknown:
            raise ValueError(f"Unknown map style: {', '.join(unknown)}.")
        styles = [s for s in STYLES if s in styles]  # known order, no repeats
        if not styles:
            raise ValueError("Keep at least one map style allowed.")
        out["allowed_styles"] = styles
    if "directions" in data:
        if data["directions"] not in DIRECTIONS:
            raise ValueError("Directions must go to Google Maps or OpenStreetMap.")
        out["directions"] = data["directions"]
    return out


def save_settings(data):
    """Merge checked changes into the stored settings and return the result."""
    merged = {**get_settings(), **clean(data)}
    _record().settings = json.dumps(merged, sort_keys=True)
    return merged
