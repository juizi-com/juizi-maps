/**
 * The block's outer container, for plain Volto (no VLT dependency).
 *
 * Under block model 2 it renders `<div class="block {@type} {className}">`
 * around the block, as Juizi blocks do. When the site and this block use
 * block model 3 (VLT draws the containers), it renders the children only.
 * Same behaviour as @kitconcept/volto-bm3-compat's BlockWrapper, without
 * the dependency.
 */
import React from 'react';
import config from '@plone/volto/registry';

const BlockWrapper = ({ data = {}, className = '', children }) => {
  const type = data['@type'];
  const v3 =
    config.settings?.blockModel === 3 &&
    config.blocks?.blocksConfig?.[type]?.blockModel === 3;
  if (v3) return <>{children}</>;
  return <div className={`block ${type || ''} ${className}`.trim()}>{children}</div>;
};

export default BlockWrapper;
