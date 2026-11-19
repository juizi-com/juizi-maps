/**
 * The map block's sidebar. Built for the block's current data, so fields
 * that don't apply to the chosen display style aren't shown.
 *
 * Registered as `juiziSchema` (see makeBlockEdit), never Volto's
 * `blockSchema`: no field has a default, see defaults.js.
 */
import messages from './messages';
import { STYLES, withDefaults } from './defaults';
import { getColours } from '../../../settings/colours';

const choices = (intl, prefix, values) =>
  values.map((v) => [v, intl.formatMessage(messages[`${prefix}_${v}`])]);

const placeSchema = ({ intl, mode }) => {
  const contact = mode === 'contact';
  const contactFields = [
    'contactAddress',
    'contactPhone',
    'contactPhone2',
    'contactPhone2Type',
    'contactEmail',
    'contactHours',
    'contactOther',
  ];
  const popupFields = [
    'summary',
    'figures',
    'items',
    'linkLabel',
    'link',
    'image',
  ];
  const fieldsets = contact
    ? [
        {
          id: 'default',
          title: intl.formatMessage(messages.place),
          fields: ['place', 'location', ...contactFields],
        },
        {
          id: 'more',
          title: intl.formatMessage(messages.fsPins),
          fields: ['summary', 'linkLabel', 'link', 'image'],
        },
      ]
    : [
        {
          id: 'default',
          title: intl.formatMessage(messages.place),
          fields: [
            'place',
            'location',
            'number',
            'numberLabel',
            ...popupFields,
          ],
        },
        {
          id: 'contact',
          title: intl.formatMessage(messages.fsContact),
          fields: contactFields,
        },
      ];
  return {
    title: intl.formatMessage(messages.place),
    addMessage: intl.formatMessage(messages.place),
    fieldsets,
    properties: {
      place: {
        title: intl.formatMessage(messages.placeName),
        description: intl.formatMessage(messages.placeNameHelp),
      },
      location: {
        title: intl.formatMessage(messages.location),
        description: intl.formatMessage(messages.locationHelp),
        widget: 'juiziMapLocation',
      },
      number: {
        title: intl.formatMessage(messages.number),
        description: intl.formatMessage(messages.numberHelp),
      },
      numberLabel: {
        title: intl.formatMessage(messages.numberLabel),
        description: intl.formatMessage(messages.numberLabelHelp),
      },
      summary: {
        title: intl.formatMessage(messages.summary),
        widget: 'textarea',
      },
      figures: {
        title: intl.formatMessage(messages.figures),
        description: intl.formatMessage(messages.figuresHelp),
        widget: 'object_list',
        schema: {
          title: intl.formatMessage(messages.figure),
          addMessage: intl.formatMessage(messages.figure),
          fieldsets: [
            { id: 'default', title: 'Default', fields: ['value', 'label'] },
          ],
          properties: {
            value: { title: intl.formatMessage(messages.figureValue) },
            label: { title: intl.formatMessage(messages.figureLabel) },
          },
          required: [],
        },
      },
      items: {
        title: intl.formatMessage(messages.items),
        description: intl.formatMessage(messages.itemsHelp),
        widget: 'object_list',
        schema: {
          title: intl.formatMessage(messages.item),
          addMessage: intl.formatMessage(messages.item),
          fieldsets: [
            { id: 'default', title: 'Default', fields: ['title', 'link'] },
          ],
          properties: {
            title: { title: intl.formatMessage(messages.itemTitle) },
            link: {
              title: intl.formatMessage(messages.itemLink),
              widget: 'object_browser',
              mode: 'link',
              allowExternals: true,
              selectedItemAttrs: ['Title', '@type'],
            },
          },
          required: [],
        },
      },
      linkLabel: {
        title: intl.formatMessage(messages.linkLabel),
        description: intl.formatMessage(messages.linkLabelHelp),
      },
      link: {
        title: intl.formatMessage(messages.link),
        widget: 'object_browser',
        mode: 'link',
        allowExternals: true,
        selectedItemAttrs: ['Title', '@type'],
      },
      image: {
        title: intl.formatMessage(messages.image),
        description: intl.formatMessage(messages.imageHelp),
        widget: 'object_browser',
        mode: 'image',
        allowExternals: false,
        selectedItemAttrs: ['image_field', 'image_scales', '@type'],
      },
      contactAddress: {
        title: intl.formatMessage(messages.contactAddress),
        description: contact
          ? undefined
          : intl.formatMessage(messages.contactIntro),
        widget: 'textarea',
      },
      contactPhone: { title: intl.formatMessage(messages.contactPhone) },
      contactPhone2: {
        title: intl.formatMessage(messages.contactPhone2),
        description: intl.formatMessage(messages.contactPhone2Help),
      },
      contactPhone2Type: {
        title: intl.formatMessage(messages.contactPhone2Type),
        choices: [
          ['whatsapp', intl.formatMessage(messages.phoneWhatsapp)],
          ['mobile', intl.formatMessage(messages.phoneMobile)],
          ['fax', intl.formatMessage(messages.phoneFax)],
          ['other', intl.formatMessage(messages.phoneOther)],
        ],
        noValueOption: false,
      },
      contactEmail: { title: intl.formatMessage(messages.contactEmail) },
      contactHours: {
        title: intl.formatMessage(messages.contactHours),
        widget: 'textarea',
      },
      contactOther: {
        title: intl.formatMessage(messages.contactOther),
        description: intl.formatMessage(messages.contactOtherHelp),
        widget: 'textarea',
      },
    },
    required: [],
  };
};

/**
 * props.allowedStyles: the display styles the site offers (Site Setup →
 * Maps). A saved map whose style is no longer offered keeps it in the list.
 */
export default function mapSchema({ intl, data, formData, props } = {}) {
  data = formData || data || props?.data || {};
  const allowed = props?.allowedStyles || STYLES;
  const d = withDefaults(data);
  const mode = data.displayMode;
  const offered = STYLES.filter((s) => allowed.includes(s) || s === mode);
  const styleField = {
    title: intl.formatMessage(messages.displayMode),
    choices: offered.map((s) => [
      s,
      intl.formatMessage(messages[`style_${s}`]),
    ]),
    noValueOption: false,
  };
  if (mode && !allowed.includes(mode)) {
    styleField.description = intl.formatMessage(messages.styleNotOffered);
  } else if (allowed.length === 1) {
    styleField.description = intl.formatMessage(messages.displayModeOne);
  }

  if (!mode) {
    return {
      title: intl.formatMessage(messages.blockTitle),
      fieldsets: [{ id: 'default', title: 'Default', fields: ['displayMode'] }],
      properties: { displayMode: styleField },
      required: [],
    };
  }

  const regions = mode === 'regions';
  const contact = mode === 'contact';
  const pinsShown = !regions || d.regionPins;
  const colours = getColours();

  const lookFields = ['mapLook'];
  if (d.mapLook !== 'street') lookFields.push('mapTone');
  if (d.mapLook !== 'outline') lookFields.push('labels');
  if (!regions && !contact && d.mapLook !== 'street')
    lookFields.push('highlight');
  lookFields.push('height');

  const pinFields = [];
  if (pinsShown) pinFields.push('pinShape');
  pinFields.push('pinColour');
  if (pinsShown && !contact) {
    pinFields.push('cluster');
    if (d.cluster) pinFields.push('groupColours');
  }
  pinFields.push('popupStyle');
  if (!contact && d.popupStyle !== 'compact') pinFields.push('itemLimit');

  const visitorFields = ['maxZoom'];
  if (!contact) visitorFields.push('listMode');
  visitorFields.push('mobileMap');

  return {
    title: intl.formatMessage(messages.blockTitle),
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'displayMode',
          ...(regions ? ['regionSet', 'regionPins'] : []),
        ],
      },
      {
        id: 'places',
        title: intl.formatMessage(messages.fsPlaces),
        fields: ['places'],
      },
      {
        id: 'look',
        title: intl.formatMessage(messages.fsLook),
        fields: lookFields,
      },
      {
        id: 'pins',
        title: intl.formatMessage(messages.fsPins),
        fields: pinFields,
      },
      {
        id: 'visitors',
        title: intl.formatMessage(messages.fsVisitors),
        fields: visitorFields,
      },
      {
        id: 'advanced',
        title: intl.formatMessage(messages.fsAdvanced),
        fields: ['extraClass'],
      },
    ],
    properties: {
      displayMode: styleField,
      regionSet: {
        title: intl.formatMessage(messages.regionSet),
        choices: [
          ['countries', intl.formatMessage(messages.regionCountries)],
          ['provinces', intl.formatMessage(messages.regionProvinces)],
        ],
        noValueOption: false,
      },
      regionPins: {
        title: intl.formatMessage(messages.regionPins),
        description: intl.formatMessage(messages.regionPinsHelp),
        type: 'boolean',
      },
      places: {
        title: intl.formatMessage(messages.places),
        description: intl.formatMessage(messages.placesHelp),
        widget: 'juiziMapPlaces',
        schema: placeSchema({ intl, mode }),
      },
      mapLook: {
        title: intl.formatMessage(messages.mapLook),
        choices: choices(intl, 'look', ['branded', 'street', 'outline']),
        noValueOption: false,
      },
      mapTone: {
        title: intl.formatMessage(messages.mapTone),
        choices: choices(intl, 'tone', ['light', 'tinted', 'dark']),
        noValueOption: false,
      },
      labels: {
        title: intl.formatMessage(messages.labels),
        choices: choices(intl, 'labels', ['all', 'nostreets', 'major', 'none']),
        noValueOption: false,
      },
      highlight: {
        title: intl.formatMessage(messages.highlight),
        type: 'boolean',
      },
      height: {
        title: intl.formatMessage(messages.height),
        choices: choices(intl, 'height', ['small', 'medium', 'large']),
        noValueOption: false,
      },
      pinShape: {
        title: intl.formatMessage(messages.pinShape),
        choices: choices(intl, 'shape', ['pin', 'dot', 'badge']),
        noValueOption: false,
      },
      pinColour: {
        title: intl.formatMessage(messages.pinColour),
        widget: 'color_picker',
        colors: colours.map((c) => ({ name: c.value, label: c.label })),
      },
      cluster: {
        title: intl.formatMessage(messages.cluster),
        description:
          mode === 'totals'
            ? intl.formatMessage(messages.clusterHelpTotals)
            : undefined,
        type: 'boolean',
      },
      groupColours: {
        title: intl.formatMessage(messages.groupColours),
        description: intl.formatMessage(messages.groupColoursHelp),
        choices: choices(intl, 'groups', ['shades', 'site']),
        noValueOption: false,
      },
      popupStyle: {
        title: intl.formatMessage(messages.popupStyle),
        choices: choices(intl, 'popup', ['card', 'band', 'compact']),
        noValueOption: false,
      },
      itemLimit: {
        title: intl.formatMessage(messages.itemLimit),
        choices: [
          ['3', '3'],
          ['5', '5'],
          ['10', '10'],
        ],
        noValueOption: false,
      },
      maxZoom: {
        title: intl.formatMessage(messages.maxZoom),
        description: intl.formatMessage(messages.maxZoomHelp),
        choices: choices(intl, 'zoom', ['4', '7', '10', '14', '18']),
        noValueOption: false,
      },
      listMode: {
        title: intl.formatMessage(messages.listMode),
        description: intl.formatMessage(messages.listHelp),
        choices: choices(intl, 'list', ['visible', 'hidden']),
        noValueOption: false,
      },
      mobileMap: {
        title: intl.formatMessage(messages.mobileMap),
        choices: [
          ['show', intl.formatMessage(messages.mobile_show)],
          [
            'hide',
            intl.formatMessage(
              contact ? messages.mobile_hide_contact : messages.mobile_hide,
            ),
          ],
        ],
        noValueOption: false,
      },
      extraClass: { title: intl.formatMessage(messages.extraClass) },
    },
    required: [],
  };
}
