import mapSVG from '@plone/volto/icons/map.svg';
import View from './View';
import Edit from './Edit';
import schema from './schema';

/** Block definition. `juiziSchema`, not `blockSchema`: see makeBlockEdit. */
const mapBlock = {
  id: 'juiziMap',
  title: 'Map',
  icon: mapSVG,
  group: 'common',
  view: View,
  edit: Edit,
  juiziSchema: schema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  blockHasOwnFocusManagement: false,
  // Colours editors can pick when juizi-blocks isn't installed. A site can
  // replace this list in its own add-on (see settings/colours.js).
  colours: null,
};

export default mapBlock;
