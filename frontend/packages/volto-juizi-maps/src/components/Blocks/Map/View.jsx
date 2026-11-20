/**
 * Map block view. The map itself draws in the browser only (MapCanvas); the
 * key, the place list and the contact cards render on the server too, so
 * every place is on the page for screen readers and search engines.
 *
 * States (see the volto-block-standards skill, section 3):
 * - no display style: start screen for editors, nothing for visitors;
 * - no finished places: a prompt for editors, nothing for visitors;
 * - unfinished places (no name or no location): left out for visitors, and
 *   listed in a hint for editors;
 * - the map fails to load: the list or cards still show, with a note;
 * - the site's cookie banner hasn't been agreed to (consent.js): no map
 *   (it would load OpenFreeMap's tiles), a note with buttons to allow it,
 *   and the list or cards as when it fails.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import BlockWrapper from '../_shared/BlockWrapper';
import BlockPlaceholder from '../_shared/BlockPlaceholder';
import BlockErrorBoundary from '../_shared/BlockErrorBoundary';
import EditHint from '../_shared/EditHint';
import { isEditing } from '../_shared/editMode';
import MapCanvas from './MapCanvas';
import useMapConsent from './consent';
import { ContactCards, GroupKey, Legend, PlaceList, ShadeKey } from './Lists';
import messages from './messages';
import { HEIGHTS, STYLES, withDefaults } from './defaults';
import {
  commonLabel,
  formatNumber,
  groupBreaks,
  sharedLabel,
  sumNumbers,
  toPlaces,
} from './engine/places';
import { contrast, mix, resolveColour } from './engine/colour';
import { pinContrast } from './engine/MapController';
import { getColours } from '../../../settings/colours';
import useMapsSettings from '../../../settings/useMapsSettings';
import './map.scss';

const useStrings = (intl) =>
  useMemo(
    () => ({
      openDetails: intl.formatMessage(messages.openDetails),
      zoomIn: intl.formatMessage(messages.zoomIn),
      placesWord: intl.formatMessage(messages.placesWord),
      placesCount: (count) =>
        intl.formatMessage(messages.placesCount, { count }),
      groupPlaces: (count) =>
        intl.formatMessage(messages.groupPlaces, { count }),
      groupTotal: (count, total) =>
        intl.formatMessage(messages.groupTotal, { count, total }),
      showAll: (count) => intl.formatMessage(messages.showAll, { count }),
      directions: intl.formatMessage(messages.directions),
      newTab: intl.formatMessage(messages.newTab),
      phone: intl.formatMessage(messages.phone),
      phone2: {
        whatsapp: intl.formatMessage(messages.phoneWhatsapp),
        mobile: intl.formatMessage(messages.phoneMobile),
        fax: intl.formatMessage(messages.phoneFax),
        other: intl.formatMessage(messages.phone),
      },
      email: intl.formatMessage(messages.email),
      hours: intl.formatMessage(messages.hours),
      close: intl.formatMessage(messages.close),
      // MapLibre's own control texts.
      mapControls: {
        'NavigationControl.ZoomIn': intl.formatMessage(messages.zoomInCtrl),
        'NavigationControl.ZoomOut': intl.formatMessage(messages.zoomOutCtrl),
        'FullscreenControl.Enter': intl.formatMessage(messages.fullscreen),
        'FullscreenControl.Exit': intl.formatMessage(messages.exitFullscreen),
        'CooperativeGesturesHandler.WindowsHelpText': intl.formatMessage(
          messages.ctrlZoom,
        ),
        'CooperativeGesturesHandler.MacHelpText': intl.formatMessage(
          messages.cmdZoom,
        ),
        'CooperativeGesturesHandler.MobileHelpText': intl.formatMessage(
          messages.touchPan,
        ),
        'Popup.Close': intl.formatMessage(messages.close),
      },
    }),
    [intl],
  );

// Shown instead of the map until the visitor agrees to it in the cookie
// banner. Also carries the banner's own placeholder class, so a site's
// styling for blocked videos applies here too.
const ConsentNote = ({ consent, intl }) => {
  const { choice, allow, manage } = consent;
  const button = (key, onClick, text) => (
    <button key={key} type="button" onClick={onClick}>
      {text}
    </button>
  );
  return (
    <div className="jmap__consent volto-gdpr-embed-disabled">
      {choice
        ? intl.formatMessage(messages.consentChoice, { title: choice.title })
        : intl.formatMessage(messages.consentAny)}{' '}
      {intl.formatMessage(messages.consentActions, {
        allow: button(
          'allow',
          allow,
          choice
            ? intl.formatMessage(messages.consentAllowChoice, {
                title: choice.title,
              })
            : intl.formatMessage(messages.consentAllowOnce),
        ),
        manage: button(
          'manage',
          manage,
          intl.formatMessage(messages.consentManage),
        ),
      })}
    </div>
  );
};

const MapBlock = (props) => {
  const { data } = props;
  const intl = useIntl();
  const history = useHistory();
  const isEditMode = isEditing(props);
  const settings = useMapsSettings().data;
  const d = withDefaults(data);
  const mode = data.displayMode;
  const strings = useStrings(intl);
  const canvasRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  // The shading key's range, from the map (it knows each region's total).
  const [shade, setShade] = useState(null);
  useEffect(() => setMounted(true), []);
  const consent = useMapConsent({ isEditMode, locale: intl.locale });
  const blocked = mounted && consent.state === 'blocked';
  // Without the map (failed or waiting for consent) the list carries it.
  const noMap = failed || blocked;

  const all = useMemo(() => toPlaces(data.places), [data.places]);
  const places = useMemo(() => all.filter((p) => p.ok), [all]);
  const unfinished = all.filter((p) => !p.ok);

  const colourValues = getColours()
    .map((c) => c.value)
    .join('|');
  // Hex colours exist only in the browser (CSS variables are read from the
  // page); the server renders no map and no colour key.
  const resolved = useMemo(() => {
    if (!mounted) return null;
    // Site lists often start with white or a pale grey (JET: White first),
    // which vanish on a light map: the main colour, the default pin colour
    // and "the site's colours" for groups use only colours that stand out.
    const all = colourValues.split('|').map((v) => resolveColour(v));
    const usable = all.filter((c) => contrast(c, '#ffffff') >= 2.5);
    const list = usable.length ? usable : all;
    return {
      main: list[0],
      pin: d.pinColour ? resolveColour(d.pinColour, list[0]) : list[0],
      list,
    };
  }, [mounted, colourValues, d.pinColour]);

  // One total in a corner of the map (totals and regions styles), only
  // when every place counts the same thing.
  const totalLabel =
    d.showTotal && (mode === 'totals' || mode === 'regions')
      ? sharedLabel(places)
      : null;
  const totalHidden =
    d.showTotal && (mode === 'totals' || mode === 'regions') && !totalLabel;

  const opts = useMemo(
    () =>
      resolved && {
        displayMode: mode,
        regionSet: d.regionSet,
        regionPins: !!d.regionPins,
        mapLook: d.mapLook,
        mapTone: d.mapTone,
        labels: d.labels,
        maxZoom: Number(d.maxZoom) || 10,
        pinShape: d.pinShape,
        pinColour: resolved.pin,
        mainColour: resolved.main,
        siteColours: resolved.list,
        cluster: !!d.cluster,
        groupColours: d.groupColours,
        highlight: !!d.highlight,
        popupStyle: d.popupStyle,
        itemLimit: Number(d.itemLimit) || 5,
        hideUnit: !!totalLabel,
        directions: settings.directions,
        strings,
        onNavigate: (href) => history.push(href),
        onSelect: setActiveId,
        onShade: (next) =>
          setShade((cur) =>
            JSON.stringify(cur) === JSON.stringify(next) ? cur : next,
          ),
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      resolved,
      mode,
      d.regionSet,
      d.regionPins,
      d.mapLook,
      d.mapTone,
      d.labels,
      d.maxZoom,
      d.pinShape,
      d.cluster,
      d.groupColours,
      d.highlight,
      d.popupStyle,
      d.itemLimit,
      totalLabel,
      settings.directions,
      strings,
    ],
  );

  if (!mode) {
    if (!isEditMode) return null;
    const offered = STYLES.filter((s) => settings.allowed_styles.includes(s));
    return (
      <BlockWrapper {...props} className="jmap-block">
        <BlockPlaceholder
          blockClass="jmap"
          prompt={intl.formatMessage(messages.startPrompt)}
          modes={offered.map((s) => ({
            name: intl.formatMessage(messages[`style_${s}`]),
            description: intl.formatMessage(messages[`style_${s}_desc`]),
          }))}
        />
      </BlockWrapper>
    );
  }

  const hint =
    unfinished.length > 0 ? (
      <EditHint isEditMode={isEditMode} tone="warning">
        {intl.formatMessage(messages.unfinishedHint, {
          count: unfinished.length,
          names: unfinished
            .map((p) => p.place || intl.formatMessage(messages.unnamedPlace))
            .join(', '),
        })}
      </EditHint>
    ) : null;

  if (!places.length) {
    if (!isEditMode) return null;
    return (
      <BlockWrapper {...props} className={`jmap-block type-${mode}`}>
        <BlockPlaceholder
          blockClass="jmap"
          prompt={intl.formatMessage(messages.emptyPrompt)}
        />
        {hint}
      </BlockWrapper>
    );
  }

  const contact = mode === 'contact';
  const totals = mode === 'totals';
  const single = contact && places.length === 1;
  const height = HEIGHTS[d.height] || HEIGHTS.medium;
  const pinsShown = mode !== 'regions' || d.regionPins;
  const unit =
    totals || mode === 'regions'
      ? commonLabel(places)
      : intl.formatMessage(messages.placesWord);

  // The colour key, once the colours are known.
  const legendRows = [];
  if (resolved && !noMap) {
    if (mode === 'regions' && shade) {
      legendRows.push(
        <ShadeKey
          key="shade"
          low={shade.low}
          high={shade.high}
          max={shade.max}
          unit={unit}
        />,
      );
    }
    if (d.cluster && pinsShown && !contact && places.length > 1) {
      const c = resolved.pin;
      let cs;
      if (d.groupColours === 'site' && resolved.list.length) {
        const i = Math.max(0, resolved.list.indexOf(c));
        const l = resolved.list;
        cs = [c, l[(i + 1) % l.length], l[(i + 2) % l.length]];
      } else {
        cs =
          d.mapTone === 'dark'
            ? [mix(c, '#ffffff', 0.45), mix(c, '#ffffff', 0.15), c]
            : [mix(c, '#ffffff', 0.4), c, mix(c, '#000000', 0.4)];
      }
      legendRows.push(
        <GroupKey
          key="groups"
          colours={cs}
          breaks={groupBreaks(places, totals)}
          unit={unit}
        />,
      );
    }
  }

  const colourWarning =
    isEditMode &&
    resolved &&
    d.mapLook !== 'street' &&
    pinContrast(resolved.pin, d.mapTone, resolved.main) < 2.2;

  const showPlace = (id) => {
    if (!canvasRef.current) return;
    // On phones with the map hidden, the list is just a list.
    const canvas = document.querySelector(
      `[data-jmap="${props.block || props.id}"] .jmap__canvas`,
    );
    if (canvas && canvas.offsetParent === null) return;
    canvasRef.current.openPlace(id);
  };

  const classes = [
    'jmap',
    `jmap--${mode}`,
    contact ? 'jmap--contact' : '',
    single ? 'jmap--single' : '',
    d.mobileMap === 'hide' ? 'jmap--nomap-phone' : '',
    failed ? 'jmap--failed' : '',
    blocked ? 'jmap--consent' : '',
    d.extraClass || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BlockWrapper {...props} className={`jmap-block type-${mode}`}>
      <div
        className={classes}
        data-jmap={props.block || props.id}
        style={{
          '--jmap-accent':
            resolved?.pin || d.pinColour || getColours()[0].value,
        }}
      >
        {hint}
        {totalHidden && (
          <EditHint isEditMode={isEditMode} tone="warning">
            {intl.formatMessage(messages.totalHidden)}
          </EditHint>
        )}
        {colourWarning && (
          <EditHint isEditMode tone="warning" live>
            {intl.formatMessage(messages.colourHard)}
          </EditHint>
        )}
        <div className="jmap__main">
          <div
            className="jmap__map"
            style={{ minHeight: height, '--jmap-height': `${height}px` }}
          >
            {totalLabel && !noMap && (
              <p className="jmap__total">
                <span className="jmap__total-n">
                  {formatNumber(sumNumbers(places))}
                </span>{' '}
                <span className="jmap__total-label">{totalLabel}</span>{' '}
                <span className="jmap__total-across">
                  {intl.formatMessage(messages.totalAcross, {
                    count: places.length,
                  })}
                </span>
              </p>
            )}
            {opts && !noMap ? (
              <MapCanvas
                ref={canvasRef}
                places={places}
                opts={opts}
                height={height}
                label={intl.formatMessage(messages.mapLabel, {
                  places: intl.formatMessage(messages.mapLabelPlaces, {
                    count: places.length,
                  }),
                })}
                onFail={() => setFailed(true)}
              />
            ) : (
              <div
                className="jmap__canvas jmap__canvas--waiting"
                style={{ height }}
                aria-hidden={blocked ? undefined : 'true'}
              >
                {failed && (
                  <p className="jmap__failed">
                    {intl.formatMessage(messages.mapUnavailable)}
                  </p>
                )}
                {blocked && !failed && (
                  <ConsentNote consent={consent} intl={intl} />
                )}
              </div>
            )}
          </div>
          {contact && (
            <ContactCards
              places={places}
              activeId={activeId}
              canShow={!noMap}
              onShow={showPlace}
              directions={settings.directions}
            />
          )}
        </div>
        {!contact && <Legend rows={legendRows} />}
        {!contact && (
          <PlaceList
            places={places}
            hidden={d.listMode === 'hidden' && !noMap}
            canShow={!noMap}
            onShow={showPlace}
          />
        )}
      </div>
    </BlockWrapper>
  );
};

const View = (props) => (
  <BlockErrorBoundary
    blockClass="jmap"
    isEditMode={isEditing(props)}
    resetKey={JSON.stringify(props.data)}
  >
    <MapBlock {...props} />
  </BlockErrorBoundary>
);

export default View;
