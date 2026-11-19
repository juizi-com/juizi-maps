/**
 * The map block's editor: the view (so the editor sees the published map)
 * plus the sidebar. The display styles offered come from the site's map
 * settings (Site Setup → Maps).
 */
import React from 'react';
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
          p && p.place !== undefined && p.title !== p.place ? { ...p, title: p.place } : p,
        ),
      }
    : data;

const BaseEdit = makeBlockEdit(View, { getChangedData, normalizeData });

const Edit = (props) => {
  const { data: settings } = useMapsSettings();
  return <BaseEdit {...props} allowedStyles={settings.allowed_styles} />;
};

export default Edit;
