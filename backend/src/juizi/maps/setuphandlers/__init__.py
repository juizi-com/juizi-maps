"""Install handling. See frontend offerAddon.js: the add-on is offered in
Site Setup → Add-ons only by frontends that include volto-juizi-maps."""

from plone.base.interfaces.installable import INonInstallable
from Products.CMFCore.utils import getToolByName
from Products.GenericSetup.tool import UNKNOWN
from zope.component.hooks import getSite
from zope.interface import implementer


DEFAULT_PROFILE = "juizi.maps:default"


def is_installed_here():
    """Read from portal_setup directly: asking Plone's installer would ask
    this utility again."""
    site = getSite()
    setup = getToolByName(site, "portal_setup", None) if site is not None else None
    if setup is None:
        return False
    return setup.getLastVersionForProfile(DEFAULT_PROFILE) != UNKNOWN


@implementer(INonInstallable)
class HiddenProfiles:
    def getNonInstallableProfiles(self):
        return ["juizi.maps:uninstall", "juizi.maps:initial"]

    def getNonInstallableProducts(self):
        """Left out of the backend's add-ons list until installed on this
        site. Several sites can share one backend; only those whose frontend
        includes volto-juizi-maps can use it, and that frontend offers it in
        Site Setup → Add-ons itself."""
        hidden = ["juizi.maps.upgrades"]
        if not is_installed_here():
            hidden.append("juizi.maps")
        return hidden
