/**
 * The colours the map block offers.
 *
 * 1. When juizi-blocks is installed it registers a `blockExtension` utility
 *    named `juiziMap` whose `colours()` returns the site colours managed in
 *    Site Setup → Juizi Blocks. Looked up at render time, so add-on order
 *    doesn't matter and nothing here imports juizi-blocks.
 * 2. Otherwise a site can set its own list in its add-on's index.ts:
 *
 *      config.blocks.blocksConfig.juiziMap.colours = [
 *        { value: '#00958e', label: 'Turquoise' },
 *        { value: '#074946', label: 'Dark turquoise' },
 *      ];
 *
 * 3. Otherwise the defaults below.
 *
 * Each colour is { value, label }. `value` is what the block saves: a hex
 * colour, or a CSS variable such as `var(--green)` (read from the page when
 * the map draws). The first colour is the site's main colour: the street map
 * in the site's colours is tinted with it.
 */
import config from '@plone/volto/registry';

export const DEFAULT_COLOURS = [
  { value: '#1f6f8b', label: 'Blue' },
  { value: '#0f3d4c', label: 'Dark blue' },
  { value: '#d9822b', label: 'Orange' },
  { value: '#2f855a', label: 'Green' },
  { value: '#3d4650', label: 'Slate' },
];

/** The juizi-blocks extension for this block, or {} without it. */
export const getExtension = () => {
  // The registry throws when nothing of a type is registered, in some
  // Volto versions: never let that stop the map rendering.
  try {
    return (
      config.getUtility({ type: 'blockExtension', name: 'juiziMap' })?.method?.() ||
      {}
    );
  } catch {
    return {};
  }
};

const valid = (list) =>
  Array.isArray(list) &&
  list.length > 0 &&
  list.every((c) => c && typeof c.value === 'string');

export const getColours = () => {
  const fromBlocks = getExtension().colours?.();
  if (valid(fromBlocks)) return fromBlocks;
  const fromSite = config.blocks?.blocksConfig?.juiziMap?.colours;
  if (valid(fromSite)) return fromSite;
  return DEFAULT_COLOURS;
};

/** Where the colours come from, for the editor's help text. */
export const coloursSource = () =>
  valid(getExtension().colours?.()) ? 'juizi-blocks' : 'site';
