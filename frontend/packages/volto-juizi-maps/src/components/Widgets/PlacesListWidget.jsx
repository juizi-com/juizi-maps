/**
 * "Places": the site's own list widget (core Volto's, or VLT's when the site
 * runs it), with each place named after its "Place name".
 *
 * VLT's list widget already shows each item's `title` (the block saves the
 * place name there too). Core Volto's always shows "Place #1, #2…", which
 * means nothing to an editor with 20 places, and it has no option for a
 * title, so this swaps the numbers for the names after it renders. If a
 * later Volto names items itself, the swap finds nothing to change.
 */
import React, { useEffect, useRef } from 'react';
import config from '@plone/volto/registry';

const PlacesListWidget = (props) => {
  const box = useRef(null);
  const ListWidget = config.widgets.widget.object_list;
  const names = (props.value || []).map((p) => (p?.place || '').trim());

  useEffect(() => {
    if (!box.current) return;
    const own = box.current.querySelector('.objectlist-widget');
    box.current.querySelectorAll('.accordion-title-wrapper').forEach((t) => {
      // Only the places themselves, not the Figures or Items lists inside one.
      if (t.closest('.objectlist-widget') !== own) return;
      const m = /#(\d+)$/.exec(t.textContent || '');
      const name = m && names[Number(m[1]) - 1];
      if (name) t.textContent = name;
    });
  });

  return (
    <div ref={box} data-jmap-places>
      <ListWidget {...props} />
    </div>
  );
};

export default PlacesListWidget;
