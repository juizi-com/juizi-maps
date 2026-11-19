/**
 * The site's map settings, as a panel. Shown on its own page (Site Setup →
 * Maps) and, when juizi-blocks is installed, as the Maps tab of the Juizi
 * Blocks dashboard. Saves on its own: it isn't part of that dashboard's
 * Save button.
 */
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import blockMessages from '../Blocks/Map/messages';
import { STYLES } from '../Blocks/Map/defaults';
import { saveMapsSettings } from '../../settings/actions';
import useMapsSettings from '../../settings/useMapsSettings';
import messages from './messages';

const MapsSettingsPanel = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const state = useMapsSettings();
  const saved = state.data;
  const [draft, setDraft] = useState(saved);
  const [done, setDone] = useState(false);
  useEffect(() => setDraft(saved), [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const allowed = draft.allowed_styles || [];

  if (state.loaded && state.installed === false) {
    return (
      <p className="juizi-dashboard__error">
        {intl.formatMessage(messages.notInstalled)}
      </p>
    );
  }

  const toggle = (style) => {
    const next = allowed.includes(style)
      ? allowed.filter((s) => s !== style)
      : STYLES.filter((s) => s === style || allowed.includes(s));
    if (!next.length) return; // at least one
    setDone(false);
    setDraft({ ...draft, allowed_styles: next });
  };

  const save = async () => {
    try {
      await dispatch(saveMapsSettings(draft));
      setDone(true);
    } catch {
      setDone(false);
    }
  };

  return (
    <div className="jmaps-settings">
      {dirty && (
        <div className="juizi-dashboard__unsaved" role="status">
          <span>{intl.formatMessage(messages.unsaved)}</span>
          <button
            type="button"
            className="juizi-dashboard__btn juizi-dashboard__btn--primary"
            onClick={save}
            disabled={state.saving}
          >
            {intl.formatMessage(messages.save)}
          </button>
          <button
            type="button"
            className="juizi-dashboard__btn juizi-dashboard__btn--secondary"
            onClick={() => setDraft(saved)}
            disabled={state.saving}
          >
            {intl.formatMessage(messages.cancel)}
          </button>
        </div>
      )}
      {state.error && (
        <div className="juizi-dashboard__error" role="alert">
          {intl.formatMessage(messages.error, { message: state.error })}
        </div>
      )}
      {done && !dirty && (
        <p className="juizi-dashboard__help" role="status">
          {intl.formatMessage(messages.saved)}
        </p>
      )}

      <section className="juizi-dashboard__section">
        <fieldset className="jmaps-settings__fieldset">
          <legend>
            <h2>{intl.formatMessage(messages.styles)}</h2>
          </legend>
          <p className="juizi-dashboard__help">
            {intl.formatMessage(messages.stylesHelp)}
          </p>
          <div className="juizi-dashboard__list">
            {STYLES.map((s) => (
              <label key={s} className="jmaps-settings__check">
                <input
                  type="checkbox"
                  checked={allowed.includes(s)}
                  disabled={allowed.length === 1 && allowed.includes(s)}
                  onChange={() => toggle(s)}
                />
                <span>
                  <strong>
                    {intl.formatMessage(blockMessages[`style_${s}`])}
                  </strong>
                  {' — '}
                  {intl.formatMessage(blockMessages[`style_${s}_desc`])}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="juizi-dashboard__section">
        <h2>
          <label htmlFor="jmaps-directions">
            {intl.formatMessage(messages.directions)}
          </label>
        </h2>
        <p className="juizi-dashboard__help">
          {intl.formatMessage(messages.directionsHelp)}
        </p>
        <select
          id="jmaps-directions"
          className="juizi-dashboard__select"
          value={draft.directions || 'google'}
          onChange={(e) => {
            setDone(false);
            setDraft({ ...draft, directions: e.target.value });
          }}
        >
          <option value="google">{intl.formatMessage(messages.google)}</option>
          <option value="openstreetmap">
            {intl.formatMessage(messages.osm)}
          </option>
        </select>
      </section>
    </div>
  );
};

export default MapsSettingsPanel;
