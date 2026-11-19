/**
 * The map block's editor: the view (so the editor sees the published map)
 * plus the sidebar. The display styles offered come from the site's map
 * settings (Site Setup → Maps).
 */
import React, { useEffect } from 'react';
import makeBlockEdit from '../../BlockEdit/BlockEdit';
import useMapsSettings from '../../../settings/useMapsSettings';
import View from './View';
import { getChangedData } from './defaults';

// Volto's list widget (and VLT's) names each item after its `title`, so the
// sidebar lists places by name.
const normalizeData = (data) =>
  Array.isArray(data.places)
    ? {
        ...data,
        places: data.places.map((p) =>
          p && p.place !== undefined && p.title !== p.place
            ? { ...p, title: p.place }
            : p,
        ),
      }
    : data;

const BaseEdit = makeBlockEdit(View, { getChangedData, normalizeData });

const Edit = (props) => {
  const { data: settings, loaded } = useMapsSettings();
  const allowed = settings.allowed_styles || [];
  const { block, data, onChangeBlock } = props;
  // A site that offers one style: choose it for the editor, with the
  // settings that suit it, instead of a start screen with one option.
  useEffect(() => {
    if (loaded && allowed.length === 1 && !data.displayMode) {
      onChangeBlock(block, getChangedData('displayMode', allowed[0], data));
    }
  }, [loaded, allowed.join(), data.displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  return <BaseEdit {...props} allowedStyles={allowed} />;
};

export default Edit;
