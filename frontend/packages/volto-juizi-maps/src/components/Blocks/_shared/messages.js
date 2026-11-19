import { defineMessages } from 'react-intl';

// The shared messages this add-on's copy of the toolkit uses. Same ids as
// in juizi-blocks, so a site running both shows one translation.
export default defineMessages({
  blockError: {
    id: 'juizi-block-error',
    defaultMessage:
      "This block couldn't be displayed. Try undoing your last change or checking its settings in the sidebar. If it keeps happening, contact your web team.",
  },
});
