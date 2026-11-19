import type { ConfigType } from '@plone/registry';
import type { BlockConfigBase } from '@plone/types';
import mapBlock from './components/Blocks/Map';
import LocationWidget from './components/Widgets/LocationWidget';
import PlacesListWidget from './components/Widgets/PlacesListWidget';
import MapsSettingsPage from './components/Settings/MapsSettingsPage';
import MapsSettingsPanel from './components/Settings/MapsSettingsPanel';
import juiziMapsSettings from './settings/reducer';
import { getExtension } from './settings/colours';
import offerAddon, { availableAddon } from './offerAddon';
import packageJson from '../package.json';

declare module '@plone/types' {
  export interface BlocksConfigData {
    juiziMap: BlockConfigBase;
  }
}

export const DESCRIPTION =
  "Map block for Volto: pins, totals, shaded regions and contact details on a street map in the site's colours. Needs the volto-juizi-maps frontend add-on.";

function applyConfig(config: ConfigType) {
  // When juizi-blocks registered its extension first, join its chooser
  // group; when it loads after, it moves the block itself.
  const group = getExtension().group;
  config.blocks.blocksConfig.juiziMap = {
    ...mapBlock,
    ...(group ? { group } : {}),
  } as any;

  config.widgets.widget.juiziMapLocation = LocationWidget;
  config.widgets.widget.juiziMapPlaces = PlacesListWidget;

  config.addonReducers = {
    ...config.addonReducers,
    juiziMapsSettings,
  };

  config.settings.controlpanels = [
    ...(config.settings.controlpanels || []),
    { '@id': '/juizi-maps', group: 'Add-on Configuration', title: 'Maps' },
  ];
  config.addonRoutes = [
    ...(config.addonRoutes || []),
    { path: '/controlpanel/juizi-maps', component: MapsSettingsPage },
  ];

  // The same settings as a tab in Site Setup → Juizi Blocks, when that
  // add-on is installed and shows tabs other add-ons register.
  config.registerUtility({
    type: 'juiziDashboardTab',
    name: 'maps',
    method: () => ({ title: 'Maps', order: 50, Component: MapsSettingsPanel }),
  });

  // Site Setup → Add-ons offers the backend add-on on this frontend; the
  // backend lists it only once it's installed (offerAddon.js).
  offerAddon(
    config,
    availableAddon({
      id: 'juizi.maps',
      title: 'Juizi Maps',
      description: DESCRIPTION,
      version: packageJson.version,
    }),
  );

  return config;
}

export default applyConfig;
