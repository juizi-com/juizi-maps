"""@juizi-maps-settings: read (anyone who can view the site) and change
(site administrators) the site's map settings."""

from juizi.maps.settings import get_settings
from juizi.maps.settings import save_settings
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zope.interface import alsoProvides

import plone.protect.interfaces


class SettingsGet(Service):
    """The settings hold nothing private (which styles editors may pick,
    where directions go), and the published map needs them, so anyone who
    can view the site may read them."""

    def reply(self):
        return get_settings()


class SettingsPatch(Service):
    def reply(self):
        alsoProvides(self.request, plone.protect.interfaces.IDisableCSRFProtection)
        try:
            data = json_body(self.request)
        except Exception:  # noqa: BLE001 - restapi raises different types
            data = None
        try:
            return save_settings(data)
        except ValueError as err:
            self.request.response.setStatus(400)
            return {"error": {"type": "BadRequest", "message": str(err)}}
