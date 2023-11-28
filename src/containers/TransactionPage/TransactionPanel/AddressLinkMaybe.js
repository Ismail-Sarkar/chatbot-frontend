import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import { ExternalLink } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build AddressLinkMaybe
const AddressLinkMaybe = props => {
  const {
    className,
    rootClassName,
    linkRootClassName,
    location,
    geolocation,
    showAddress,
    manualAddress,
    fullManualAddress,
  } = props;
  const { address, building } = location || {};
  const { lat, lng } = geolocation || {};
  const hrefToGoogleMaps = geolocation
    ? `https://maps.google.com/?q=${lat},${lng}`
    : address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : null;

  const fullAddress =
    typeof building === 'string' && building.length > 0 ? `${building}, ${address}` : address;

  const classes = classNames(rootClassName || css.address, className);
  return showAddress && hrefToGoogleMaps ? (
    manualAddress ? (
      <p className={classes}>
        {fullManualAddress?.street} <br />
      </p>
    ) : (
      <div className={classes}>
        {fullAddress} <br />
        <div className={css.viewOnGoogleMapsWrapper}>
          <ExternalLink className={linkRootClassName} href={hrefToGoogleMaps}>
            <FormattedMessage id="AddressLinkMaybe.viewOnGoogleMaps" />
          </ExternalLink>
        </div>
      </div>
    )
  ) : null;
};

export default AddressLinkMaybe;
