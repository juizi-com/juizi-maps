"""Interfaces for juizi.maps."""

from zope import schema
from zope.interface import Interface
from zope.publisher.interfaces.browser import IDefaultBrowserLayer


class IBrowserLayer(IDefaultBrowserLayer):
    """Marker interface: juizi.maps is installed on this site."""


class IMapsSettings(Interface):
    """Site-wide map settings, edited in Site Setup → Maps (or the Maps tab
    of the Juizi Blocks dashboard when that add-on is installed too).

    Kept as one JSON text record so new settings don't need an upgrade step
    to add a registry field. ``juizi.maps.settings`` reads and checks it."""

    settings = schema.Text(
        title="Map settings (JSON)",
        description="Edited in Site Setup → Maps. Checked when saved.",
        required=False,
        default="{}",
    )
