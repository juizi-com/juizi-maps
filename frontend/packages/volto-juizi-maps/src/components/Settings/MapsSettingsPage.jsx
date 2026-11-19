/**
 * Site Setup → Maps (/controlpanel/juizi-maps). The Juizi dashboard look,
 * footer and back button (the dashboard recipe), without juizi-blocks.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'semantic-ui-react';
import Helmet from '@plone/volto/helpers/Helmet/Helmet';
import { getParentUrl } from '@plone/volto/helpers/Url/Url';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import Unauthorized from '@plone/volto/components/theme/Unauthorized/Unauthorized';
import { useClient } from '@plone/volto/hooks/client/useClient';
import backSVG from '@plone/volto/icons/back.svg';
import packageJson from '../../../package.json';
import MapsSettingsPanel from './MapsSettingsPanel';
import { getExtension } from '../../settings/colours';
import messages from './messages';
import './juizi-dashboard.scss';
import './settings.scss';

const MapsSettingsPage = () => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const isClient = useClient();
  const token = useSelector((state) => state.userSession?.token);
  if (!token) return <Unauthorized />;
  const withBlocks = Boolean(getExtension().colours);

  return (
    <div className="juizi-dashboard jmaps-settings-page">
      <Helmet title={intl.formatMessage(messages.title)} />
      <h1>{intl.formatMessage(messages.title)}</h1>
      <p className="juizi-dashboard__description">
        {intl.formatMessage(messages.description)}
      </p>
      {withBlocks && (
        <p className="juizi-dashboard__help">
          {intl.formatMessage(messages.alsoInBlocks)}
        </p>
      )}

      <MapsSettingsPanel />

      {/* Not a <p>: Volto Light Theme restyles every `.content-area p > a`. */}
      <div className="juizi-dashboard__version-footer">
        <span className="juizi-dashboard__credit">
          <span aria-hidden>❤️🤖</span> Vibe Coded with Care by{' '}
          <a
            href="https://github.com/aboycalledhero"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboycalledhero
          </a>
        </span>
        <span className="juizi-dashboard__version">
          {packageJson.name} v{packageJson.version}
        </span>
      </div>

      {isClient &&
        createPortal(
          <Toolbar
            pathname={location.pathname}
            hideDefaultViewButtons
            inner={
              <Button
                className="item"
                aria-label={intl.formatMessage(messages.back)}
                title={intl.formatMessage(messages.back)}
                onClick={() => history.push(getParentUrl(location.pathname))}
              >
                <Icon name={backSVG} className="contents circled" size="30px" />
              </Button>
            }
          />,
          document.getElementById('toolbar'),
        )}
    </div>
  );
};

export default MapsSettingsPage;
