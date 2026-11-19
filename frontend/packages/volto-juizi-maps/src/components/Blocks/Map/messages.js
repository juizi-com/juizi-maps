import { defineMessages } from 'react-intl';

export default defineMessages({
  blockTitle: { id: 'juiziMap.blockTitle', defaultMessage: 'Map' },

  // Start screen
  startPrompt: {
    id: 'juiziMap.startPrompt',
    defaultMessage:
      'You added a map. Choose a display style in the sidebar to get started:',
  },
  emptyPrompt: {
    id: 'juiziMap.emptyPrompt',
    defaultMessage:
      'No places on the map yet. Add them in the sidebar, under "Places on the map".',
  },
  unfinishedHint: {
    id: 'juiziMap.unfinishedHint',
    defaultMessage:
      '{count, plural, one {One place isn’t on the map yet} other {# places aren’t on the map yet}}: {names}. Each place needs a name and a location. Visitors won’t see it until then.',
  },
  unnamedPlace: { id: 'juiziMap.unnamedPlace', defaultMessage: 'a place with no name' },
  styleNotOffered: {
    id: 'juiziMap.styleNotOffered',
    defaultMessage:
      'This site no longer offers this style for new maps. This map keeps it until you choose another.',
  },
  colourHard: {
    id: 'juiziMap.colourHard',
    defaultMessage:
      'Optional: this pin colour is hard to see on these map colours. Try another colour, or other map colours.',
  },

  // Display styles
  style_pins: { id: 'juiziMap.style.pins', defaultMessage: 'Pins on a map' },
  style_pins_desc: {
    id: 'juiziMap.style.pins.desc',
    defaultMessage: 'a pin for each place; click one to see its details',
  },
  style_totals: { id: 'juiziMap.style.totals', defaultMessage: 'Pins with totals' },
  style_totals_desc: {
    id: 'juiziMap.style.totals.desc',
    defaultMessage:
      'each pin shows a number, such as "16 schools"; nearby pins add up',
  },
  style_regions: { id: 'juiziMap.style.regions', defaultMessage: 'Shaded regions' },
  style_regions_desc: {
    id: 'juiziMap.style.regions.desc',
    defaultMessage:
      'countries or provinces coloured by their total: darker means more',
  },
  style_contact: {
    id: 'juiziMap.style.contact',
    defaultMessage: 'Places with contact details',
  },
  style_contact_desc: {
    id: 'juiziMap.style.contact.desc',
    defaultMessage:
      'offices or venues with address, phone and email shown beside or under the map',
  },

  // Sidebar: fieldsets
  fsPlaces: { id: 'juiziMap.fs.places', defaultMessage: 'Places on the map' },
  fsLook: { id: 'juiziMap.fs.look', defaultMessage: 'How the map looks' },
  fsPins: { id: 'juiziMap.fs.pins', defaultMessage: 'Pins and pop-ups' },
  fsVisitors: { id: 'juiziMap.fs.visitors', defaultMessage: 'For visitors' },

  // Sidebar: first choice
  displayMode: { id: 'juiziMap.displayMode', defaultMessage: 'Display style' },
  displayModeOne: {
    id: 'juiziMap.displayModeOne',
    defaultMessage: 'This site offers one style for maps.',
  },
  regionSet: { id: 'juiziMap.regionSet', defaultMessage: 'Shade' },
  regionCountries: { id: 'juiziMap.regionSet.countries', defaultMessage: 'Countries' },
  regionProvinces: {
    id: 'juiziMap.regionSet.provinces',
    defaultMessage: 'South African provinces',
  },
  regionPins: {
    id: 'juiziMap.regionPins',
    defaultMessage: 'Show pins on top of the shading',
  },
  regionPinsHelp: {
    id: 'juiziMap.regionPinsHelp',
    defaultMessage:
      'Small islands are too small to shade, so they always get a pin.',
  },

  // Places
  places: { id: 'juiziMap.places', defaultMessage: 'Places' },
  placesHelp: {
    id: 'juiziMap.placesHelp',
    defaultMessage: 'Each place gets a pin. Open a place to fill in its details.',
  },
  place: { id: 'juiziMap.place', defaultMessage: 'Place' },
  placeName: { id: 'juiziMap.placeName', defaultMessage: 'Place name' },
  placeNameHelp: {
    id: 'juiziMap.placeNameHelp',
    defaultMessage: 'The heading of its pop-up, e.g. "Kenya" or "Cape Town office".',
  },
  location: { id: 'juiziMap.location', defaultMessage: 'Where it is' },
  locationHelp: {
    id: 'juiziMap.locationHelp',
    defaultMessage:
      'Click the small map or drag the pin. For a small town or a school, paste exact coordinates from Google Maps. Visitors see the pin, never the numbers.',
  },
  number: { id: 'juiziMap.number', defaultMessage: 'Number' },
  numberHelp: {
    id: 'juiziMap.numberHelp',
    defaultMessage: 'Optional: e.g. 16. Shown in the pop-up and, with totals, on the pin.',
  },
  numberLabel: { id: 'juiziMap.numberLabel', defaultMessage: 'What it counts' },
  numberLabelHelp: {
    id: 'juiziMap.numberLabelHelp',
    defaultMessage: 'e.g. "schools" or "projects".',
  },
  summary: { id: 'juiziMap.summary', defaultMessage: 'Short description' },
  figures: { id: 'juiziMap.figures', defaultMessage: 'Figures' },
  figuresHelp: {
    id: 'juiziMap.figuresHelp',
    defaultMessage: 'Optional: a breakdown, e.g. "11 Primary schools", "5 High schools".',
  },
  figure: { id: 'juiziMap.figure', defaultMessage: 'Figure' },
  figureValue: { id: 'juiziMap.figureValue', defaultMessage: 'Number' },
  figureLabel: { id: 'juiziMap.figureLabel', defaultMessage: 'What it counts' },
  items: { id: 'juiziMap.items', defaultMessage: 'Projects or items' },
  itemsHelp: {
    id: 'juiziMap.itemsHelp',
    defaultMessage: 'Optional: a list in the pop-up. Each can link to its page.',
  },
  item: { id: 'juiziMap.item', defaultMessage: 'Item' },
  itemTitle: { id: 'juiziMap.itemTitle', defaultMessage: 'Name' },
  itemLink: { id: 'juiziMap.itemLink', defaultMessage: 'Link' },
  linkLabel: { id: 'juiziMap.linkLabel', defaultMessage: 'Button text' },
  linkLabelHelp: {
    id: 'juiziMap.linkLabelHelp',
    defaultMessage: 'Optional: e.g. "All projects in Kenya". Needs a link too.',
  },
  link: { id: 'juiziMap.link', defaultMessage: 'Button link' },
  image: { id: 'juiziMap.image', defaultMessage: 'Picture' },
  imageHelp: {
    id: 'juiziMap.imageHelp',
    defaultMessage: 'Optional: shown at the top of the pop-up. Add it to the site first.',
  },
  fsContact: { id: 'juiziMap.fs.contact', defaultMessage: 'Contact details' },
  contactIntro: {
    id: 'juiziMap.contactIntro',
    defaultMessage:
      'Optional: an address, phone number or email for this place, e.g. a regional office. A "Get directions" link is added for you.',
  },
  contactAddress: { id: 'juiziMap.contactAddress', defaultMessage: 'Address' },
  contactPhone: { id: 'juiziMap.contactPhone', defaultMessage: 'Phone' },
  contactPhone2: { id: 'juiziMap.contactPhone2', defaultMessage: 'Second number' },
  contactPhone2Help: {
    id: 'juiziMap.contactPhone2Help',
    defaultMessage: 'Optional: e.g. a WhatsApp or mobile number.',
  },
  contactPhone2Type: { id: 'juiziMap.contactPhone2Type', defaultMessage: 'Second number is' },
  phoneWhatsapp: { id: 'juiziMap.phone.whatsapp', defaultMessage: 'WhatsApp' },
  phoneMobile: { id: 'juiziMap.phone.mobile', defaultMessage: 'Mobile' },
  phoneFax: { id: 'juiziMap.phone.fax', defaultMessage: 'Fax' },
  phoneOther: { id: 'juiziMap.phone.other', defaultMessage: 'Another phone' },
  contactEmail: { id: 'juiziMap.contactEmail', defaultMessage: 'Email' },
  contactHours: { id: 'juiziMap.contactHours', defaultMessage: 'Opening hours' },
  contactOther: { id: 'juiziMap.contactOther', defaultMessage: 'Other details' },
  contactOtherHelp: {
    id: 'juiziMap.contactOtherHelp',
    defaultMessage: 'Optional: e.g. parking or how to find the entrance. A blank line starts a new paragraph.',
  },

  // How the map looks
  mapLook: { id: 'juiziMap.mapLook', defaultMessage: 'Map' },
  look_branded: { id: 'juiziMap.look.branded', defaultMessage: 'Street map in the site’s colours' },
  look_street: { id: 'juiziMap.look.street', defaultMessage: 'Standard street map' },
  look_outline: { id: 'juiziMap.look.outline', defaultMessage: 'Simple outline: country and province shapes only' },
  mapTone: { id: 'juiziMap.mapTone', defaultMessage: 'Map colours' },
  tone_light: { id: 'juiziMap.tone.light', defaultMessage: 'Light' },
  tone_tinted: { id: 'juiziMap.tone.tinted', defaultMessage: 'Tinted' },
  tone_dark: { id: 'juiziMap.tone.dark', defaultMessage: 'Dark' },
  labels: { id: 'juiziMap.labels', defaultMessage: 'Names on the map' },
  labels_all: { id: 'juiziMap.labels.all', defaultMessage: 'All names' },
  labels_nostreets: { id: 'juiziMap.labels.nostreets', defaultMessage: 'No street names' },
  labels_major: { id: 'juiziMap.labels.major', defaultMessage: 'Only countries, provinces and cities' },
  labels_none: { id: 'juiziMap.labels.none', defaultMessage: 'No names' },
  height: { id: 'juiziMap.height', defaultMessage: 'Map height' },
  height_small: { id: 'juiziMap.height.small', defaultMessage: 'Short' },
  height_medium: { id: 'juiziMap.height.medium', defaultMessage: 'Medium' },
  height_large: { id: 'juiziMap.height.large', defaultMessage: 'Tall' },
  highlight: { id: 'juiziMap.highlight', defaultMessage: 'Colour the countries or provinces that have places' },

  // Pins and pop-ups
  pinShape: { id: 'juiziMap.pinShape', defaultMessage: 'Pin shape' },
  shape_pin: { id: 'juiziMap.shape.pin', defaultMessage: 'Pin' },
  shape_dot: { id: 'juiziMap.shape.dot', defaultMessage: 'Dot' },
  shape_badge: { id: 'juiziMap.shape.badge', defaultMessage: 'Label' },
  pinColour: { id: 'juiziMap.pinColour', defaultMessage: 'Pin colour' },
  cluster: { id: 'juiziMap.cluster', defaultMessage: 'Group pins that are close together' },
  clusterHelpTotals: {
    id: 'juiziMap.clusterHelpTotals',
    defaultMessage: 'Grouped pins show the total of the pins inside.',
  },
  groupColours: { id: 'juiziMap.groupColours', defaultMessage: 'Group colours' },
  groupColoursHelp: {
    id: 'juiziMap.groupColoursHelp',
    defaultMessage: 'Bigger groups get a different colour. A key under the map explains them.',
  },
  groups_shades: { id: 'juiziMap.groups.shades', defaultMessage: 'Shades of the pin colour' },
  groups_site: { id: 'juiziMap.groups.site', defaultMessage: 'The site’s colours' },
  popupStyle: { id: 'juiziMap.popupStyle', defaultMessage: 'Pop-up style' },
  popup_card: { id: 'juiziMap.popup.card', defaultMessage: 'Card' },
  popup_band: { id: 'juiziMap.popup.band', defaultMessage: 'Card with a coloured top' },
  popup_compact: { id: 'juiziMap.popup.compact', defaultMessage: 'Small label' },
  itemLimit: { id: 'juiziMap.itemLimit', defaultMessage: 'Items shown before "Show all"' },

  // For visitors
  maxZoom: { id: 'juiziMap.maxZoom', defaultMessage: 'Closest zoom for visitors' },
  maxZoomHelp: {
    id: 'juiziMap.maxZoomHelp',
    defaultMessage: 'Stops visitors zooming in further, e.g. so they can’t find a school’s street.',
  },
  zoom_4: { id: 'juiziMap.zoom.country', defaultMessage: 'Whole country' },
  zoom_7: { id: 'juiziMap.zoom.province', defaultMessage: 'Province or region' },
  zoom_10: { id: 'juiziMap.zoom.town', defaultMessage: 'Town' },
  zoom_14: { id: 'juiziMap.zoom.neighbourhood', defaultMessage: 'Neighbourhood' },
  zoom_18: { id: 'juiziMap.zoom.street', defaultMessage: 'Street' },
  listMode: { id: 'juiziMap.listMode', defaultMessage: 'List of places under the map' },
  list_visible: { id: 'juiziMap.list.visible', defaultMessage: 'Show it' },
  list_hidden: { id: 'juiziMap.list.hidden', defaultMessage: 'Only for screen readers' },
  listHelp: {
    id: 'juiziMap.listHelp',
    defaultMessage: 'Screen readers always get the list, so everyone can reach every place.',
  },
  mobileMap: { id: 'juiziMap.mobileMap', defaultMessage: 'On phones' },
  mobile_show: { id: 'juiziMap.mobile.show', defaultMessage: 'Show the map' },
  mobile_hide: { id: 'juiziMap.mobile.hide', defaultMessage: 'Hide the map, show the list of places' },
  mobile_hide_contact: {
    id: 'juiziMap.mobile.hideContact',
    defaultMessage: 'Hide the map, show the contact details',
  },
  extraClass: { id: 'juiziMap.extraClass', defaultMessage: 'Extra style name (for your web team)' },
  fsAdvanced: { id: 'juiziMap.fs.advanced', defaultMessage: 'Advanced' },

  // Visitor-facing
  allPlaces: { id: 'juiziMap.allPlaces', defaultMessage: 'All places' },
  contactDetails: { id: 'juiziMap.contactDetails', defaultMessage: 'Contact details' },
  mapLabel: { id: 'juiziMap.mapLabel', defaultMessage: 'Map: {places}' },
  mapLabelPlaces: {
    id: 'juiziMap.mapLabelPlaces',
    defaultMessage: '{count, plural, one {one place} other {# places}}. The same places are listed below the map.',
  },
  groupsKey: { id: 'juiziMap.groupsKey', defaultMessage: 'Groups of pins:' },
  under: { id: 'juiziMap.under', defaultMessage: 'under {n}' },
  between: { id: 'juiziMap.between', defaultMessage: '{a} to {b}' },
  over: { id: 'juiziMap.over', defaultMessage: 'over {n} {unit}' },
  placesWord: { id: 'juiziMap.placesWord', defaultMessage: 'places' },
  placesCount: {
    id: 'juiziMap.placesCount',
    defaultMessage: '{count, plural, one {# place} other {# places}}',
  },
  groupPlaces: {
    id: 'juiziMap.groupPlaces',
    defaultMessage: '{count, plural, one {# place} other {# places}} close together',
  },
  groupTotal: {
    id: 'juiziMap.groupTotal',
    defaultMessage: '{count, plural, one {# place} other {# places}}, {total} in total',
  },
  zoomIn: { id: 'juiziMap.zoomIn', defaultMessage: 'Zoom in to see them' },
  openDetails: { id: 'juiziMap.openDetails', defaultMessage: 'Show details' },
  showOnMap: { id: 'juiziMap.showOnMap', defaultMessage: 'Show on the map' },
  showAll: { id: 'juiziMap.showAll', defaultMessage: 'Show all {count}' },
  directions: { id: 'juiziMap.directions', defaultMessage: 'Get directions' },
  newTab: { id: 'juiziMap.newTab', defaultMessage: '(opens in a new tab)' },
  phone: { id: 'juiziMap.phoneLabel', defaultMessage: 'Phone' },
  email: { id: 'juiziMap.emailLabel', defaultMessage: 'Email' },
  hours: { id: 'juiziMap.hoursLabel', defaultMessage: 'Open' },
  close: { id: 'juiziMap.close', defaultMessage: 'Close' },
  mapUnavailable: {
    id: 'juiziMap.mapUnavailable',
    defaultMessage: 'The map couldn’t load. The places are listed below.',
  },
  ctrlZoom: { id: 'juiziMap.ctrlZoom', defaultMessage: 'Use Ctrl + scroll to zoom the map' },
  cmdZoom: { id: 'juiziMap.cmdZoom', defaultMessage: 'Use ⌘ + scroll to zoom the map' },
  touchPan: { id: 'juiziMap.touchPan', defaultMessage: 'Use two fingers to move the map' },
  zoomInCtrl: { id: 'juiziMap.zoomInCtrl', defaultMessage: 'Zoom in' },
  zoomOutCtrl: { id: 'juiziMap.zoomOutCtrl', defaultMessage: 'Zoom out' },
  fullscreen: { id: 'juiziMap.fullscreen', defaultMessage: 'Full screen' },
  exitFullscreen: { id: 'juiziMap.exitFullscreen', defaultMessage: 'Leave full screen' },

  // Location widget
  pickHint: {
    id: 'juiziMap.pickHint',
    defaultMessage: 'Click the map to place the pin, or drag it.',
  },
  latitude: { id: 'juiziMap.latitude', defaultMessage: 'Latitude' },
  longitude: { id: 'juiziMap.longitude', defaultMessage: 'Longitude' },
  paste: { id: 'juiziMap.paste', defaultMessage: 'Paste coordinates or a Google Maps link' },
  pasteBad: {
    id: 'juiziMap.pasteBad',
    defaultMessage: 'Those don’t look like coordinates. Try "-25.7313, 28.2184", or a Google Maps link.',
  },
  clearLocation: { id: 'juiziMap.clearLocation', defaultMessage: 'Remove the location' },
});
