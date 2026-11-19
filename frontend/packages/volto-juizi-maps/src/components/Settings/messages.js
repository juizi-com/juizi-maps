import { defineMessages } from 'react-intl';

export default defineMessages({
  title: { id: 'juiziMaps.settings.title', defaultMessage: 'Maps' },
  description: {
    id: 'juiziMaps.settings.description',
    defaultMessage: 'Settings for every map block on this site.',
  },
  styles: { id: 'juiziMaps.settings.styles', defaultMessage: 'Map styles editors can choose' },
  stylesHelp: {
    id: 'juiziMaps.settings.stylesHelp',
    defaultMessage:
      'Maps already on a page keep their style, even when it’s no longer ticked here. Keep at least one.',
  },
  directions: { id: 'juiziMaps.settings.directions', defaultMessage: '“Get directions” opens' },
  directionsHelp: {
    id: 'juiziMaps.settings.directionsHelp',
    defaultMessage: 'Most phones open Google Maps in its own app.',
  },
  google: { id: 'juiziMaps.settings.google', defaultMessage: 'Google Maps' },
  osm: { id: 'juiziMaps.settings.osm', defaultMessage: 'OpenStreetMap' },
  save: { id: 'juiziMaps.settings.save', defaultMessage: 'Save' },
  saved: { id: 'juiziMaps.settings.saved', defaultMessage: 'Saved.' },
  cancel: { id: 'juiziMaps.settings.cancel', defaultMessage: 'Cancel' },
  unsaved: { id: 'juiziMaps.settings.unsaved', defaultMessage: 'You have unsaved changes.' },
  error: {
    id: 'juiziMaps.settings.error',
    defaultMessage: 'Couldn’t save: {message}',
  },
  notInstalled: {
    id: 'juiziMaps.settings.notInstalled',
    defaultMessage:
      'Juizi Maps isn’t installed on this site yet. Install it in Site Setup → Add-ons, then come back here.',
  },
  alsoInBlocks: {
    id: 'juiziMaps.settings.alsoInBlocks',
    defaultMessage: 'The same settings are on the Maps tab of Site Setup → Juizi Blocks.',
  },
  back: { id: 'juiziMaps.settings.back', defaultMessage: 'Back to Site Setup' },
});
