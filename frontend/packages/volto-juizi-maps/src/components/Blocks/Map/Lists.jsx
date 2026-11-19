/**
 * What renders on the page around the map, on the server too: the key for
 * group colours and shading, the list of places, and the contact cards.
 * Screen readers and search engines get every place from here, never only
 * from the map.
 */
import React from 'react';
import { useIntl } from 'react-intl';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import messages from './messages';
import {
  directionsHref,
  formatNumber as fmt,
  isExternal,
  telHref,
  whatsappHref,
} from './engine/places';

const Lines = ({ text }) =>
  String(text || '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {l}
      </React.Fragment>
    ));

const Link = ({ href, className, children }) => {
  const intl = useIntl();
  if (isExternal(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="jmap-sr-only"> {intl.formatMessage(messages.newTab)}</span>
      </a>
    );
  }
  return (
    <UniversalLink className={className} href={href}>
      {children}
    </UniversalLink>
  );
};

export const Legend = ({ rows }) =>
  rows.length ? <div className="jmap__legend">{rows}</div> : null;

export const GroupKey = ({ colours, breaks, unit }) => {
  const intl = useIntl();
  const key = (c, text) => (
    <span className="jmap__key" key={text}>
      <span className="jmap__dot" style={{ background: c }} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
  return (
    <div className="jmap__legend-row">
      <span className="jmap__legend-title">{intl.formatMessage(messages.groupsKey)}</span>
      {key(colours[0], intl.formatMessage(messages.under, { n: fmt(breaks.small) }))}
      {key(
        colours[1],
        intl.formatMessage(messages.between, { a: fmt(breaks.small), b: fmt(breaks.large) }),
      )}
      {key(colours[2], intl.formatMessage(messages.over, { n: fmt(breaks.large), unit }))}
    </div>
  );
};

export const ShadeKey = ({ low, high, max, unit }) => (
  <div className="jmap__legend-row">
    <span>1</span>
    <span
      className="jmap__ramp"
      style={{ background: `linear-gradient(90deg, ${low}, ${high})` }}
      aria-hidden="true"
    />
    <span>
      {fmt(max)} {unit}
    </span>
  </div>
);

export const PlaceList = ({ places, hidden, canShow, onShow }) => {
  const intl = useIntl();
  const sorted = [...places].sort(
    (a, b) => (b.number || 0) - (a.number || 0) || a.place.localeCompare(b.place),
  );
  return (
    <div className={`jmap__list${hidden ? ' jmap-sr-only' : ''}`}>
      <h3 className="jmap__list-title">{intl.formatMessage(messages.allPlaces)}</h3>
      <ul className="jmap__places">
        {sorted.map((p) => (
          <li key={p.id}>
            {canShow ? (
              <button type="button" onClick={() => onShow(p.id)}>
                {p.place}
              </button>
            ) : (
              <span className="jmap__place-name">{p.place}</span>
            )}
            {p.number != null && (
              <span className="jmap__n">
                {fmt(p.number)} {p.numberLabel}
              </span>
            )}
            {/* Screen readers get the pop-up's content here too. */}
            {(p.figures.length > 0 || p.items.length > 0 || p.summary) && (
              <div className="jmap-sr-only">
                {p.summary && <p>{p.summary}</p>}
                {p.figures.length > 0 && (
                  <ul>
                    {p.figures.map((f, i) => (
                      <li key={f.id || i}>
                        {f.value} {f.label}
                      </li>
                    ))}
                  </ul>
                )}
                {p.items.length > 0 && (
                  <ul>
                    {p.items.map((it, i) => (
                      <li key={it.id || i}>
                        {it.href ? <Link href={it.href}>{it.title}</Link> : it.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/** schema.org markup so search engines can show the office details. */
const ContactCard = ({ place: p, single, active, canShow, onShow, directions }) => {
  const intl = useIntl();
  const c = p.contact;
  const phone2Label = {
    whatsapp: messages.phoneWhatsapp,
    mobile: messages.phoneMobile,
    fax: messages.phoneFax,
    other: messages.phone,
  }[c.phone2Type || 'other'];
  return (
    <article
      className={`jmap-office${active ? ' is-active' : ''}`}
      itemScope
      itemType="https://schema.org/Place"
    >
      {p.image && <img className="jmap-office__img" src={p.image} alt="" loading="lazy" />}
      <h3 className="jmap-office__name" itemProp="name">
        {p.place}
      </h3>
      {p.summary && <p className="jmap-office__summary">{p.summary}</p>}
      {c.address.trim() && (
        <p className="jmap-contact__address" itemProp="address">
          <Lines text={c.address} />
        </p>
      )}
      {(c.phone || c.phone2 || c.email || c.hours) && (
        <dl className="jmap-contact__rows">
          {c.phone.trim() && (
            <>
              <dt>{intl.formatMessage(messages.phone)}</dt>
              <dd>
                <a href={telHref(c.phone)} itemProp="telephone">
                  {c.phone}
                </a>
              </dd>
            </>
          )}
          {c.phone2.trim() && (
            <>
              <dt>{intl.formatMessage(phone2Label)}</dt>
              <dd>
                {c.phone2Type === 'whatsapp' ? (
                  <a href={whatsappHref(c.phone2)} target="_blank" rel="noopener noreferrer">
                    {c.phone2}
                  </a>
                ) : (
                  <a href={telHref(c.phone2)}>{c.phone2}</a>
                )}
              </dd>
            </>
          )}
          {c.email.trim() && (
            <>
              <dt>{intl.formatMessage(messages.email)}</dt>
              <dd>
                <a href={`mailto:${c.email.trim()}`} itemProp="email">
                  {c.email}
                </a>
              </dd>
            </>
          )}
          {c.hours.trim() && (
            <>
              <dt>{intl.formatMessage(messages.hours)}</dt>
              <dd>
                <Lines text={c.hours} />
              </dd>
            </>
          )}
        </dl>
      )}
      {c.other.trim() && (
        <div className="jmap-contact__other">
          {c.other.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>
              <Lines text={para} />
            </p>
          ))}
        </div>
      )}
      {p.hasLocation && (
        <span itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
          <meta itemProp="latitude" content={String(p.lat)} />
          <meta itemProp="longitude" content={String(p.lng)} />
        </span>
      )}
      <div className="jmap-office__actions">
        {p.hasLocation && (
          <a
            className="jmap-office__directions"
            href={directionsHref(p, directions)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {intl.formatMessage(messages.directions)}
            <span className="jmap-sr-only"> {intl.formatMessage(messages.newTab)}</span>
          </a>
        )}
        {!single && canShow && p.hasLocation && (
          <button type="button" className="jmap-office__show" onClick={() => onShow(p.id)}>
            {intl.formatMessage(messages.showOnMap)}
          </button>
        )}
        {p.linkHref && p.linkLabel && (
          <Link href={p.linkHref} className="jmap-pop__btn">
            {p.linkLabel}
          </Link>
        )}
      </div>
    </article>
  );
};

export const ContactCards = ({ places, activeId, canShow, onShow, directions }) => {
  const intl = useIntl();
  const single = places.length === 1;
  return (
    <div className="jmap__offices">
      <h3 className="jmap-sr-only">{intl.formatMessage(messages.contactDetails)}</h3>
      {places.map((p) => (
        <ContactCard
          key={p.id}
          place={p}
          single={single}
          active={activeId === p.id}
          canShow={canShow}
          onShow={onShow}
          directions={directions}
        />
      ))}
    </div>
  );
};
