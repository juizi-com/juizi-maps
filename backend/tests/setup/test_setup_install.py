from juizi.maps import PACKAGE_NAME


class TestSetupInstall:
    def test_addon_installed(self, installer):
        assert installer.is_product_installed(PACKAGE_NAME) is True

    def test_browserlayer(self, browser_layers):
        from juizi.maps.interfaces import IBrowserLayer

        assert IBrowserLayer in browser_layers

    def test_latest_version(self, profile_last_version):
        assert profile_last_version(f"{PACKAGE_NAME}:default") == "1000"

    def test_listed_once_installed(self, portal):
        """Installed here, so the add-ons list shows it (for upgrades and
        uninstalling)."""
        from juizi.maps.setuphandlers import HiddenProfiles

        assert PACKAGE_NAME not in HiddenProfiles().getNonInstallableProducts()

    def test_settings_record(self, portal):
        from juizi.maps.settings import get_settings

        assert get_settings()["allowed_styles"] == [
            "pins",
            "totals",
            "regions",
            "contact",
        ]


class TestUninstall:
    def test_hidden_when_not_installed(self, installer, portal):
        """Several sites share a backend: until a site installs it, only a
        frontend with volto-juizi-maps offers it (see offerAddon.js)."""
        from juizi.maps.setuphandlers import HiddenProfiles

        installer.uninstall_product(PACKAGE_NAME)
        portal.portal_setup.setLastVersionForProfile(
            f"{PACKAGE_NAME}:default", "unknown"
        )
        assert PACKAGE_NAME in HiddenProfiles().getNonInstallableProducts()
