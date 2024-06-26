import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { Heading } from '../../../components';

import AddressLinkMaybe from './AddressLinkMaybe';

import css from './TransactionPanel.module.css';
import ProviderEmailMaybe from './ProviderEmailMaybe';

// Functional component as a helper to build ActivityFeed section
const BookingLocationMaybe = props => {
  const {
    className,
    rootClassName,
    listing,
    showBookingLocation,
    provider,
    isCustomer,
    protectedData,
  } = props;
  const classes = classNames(rootClassName || css.bookingLocationContainer, className);

  if (showBookingLocation) {
    const { location, manualAddress, fullManualAddress } = listing?.attributes?.publicData || {};
    return (
      <div className={classes}>
        {protectedData && protectedData.confirmationNumber && (
          <div>{`Confirmation #${protectedData.confirmationNumber}`}</div>
        )}
        <Heading as="h3" rootClassName={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.bookingLocationHeading" />
        </Heading>
        <div className={css.bookingLocationContent}>
          <AddressLinkMaybe
            linkRootClassName={css.bookingLocationAddress}
            location={location}
            geolocation={listing?.attributes?.geolocation}
            showAddress={true}
            manualAddress={manualAddress}
            fullManualAddress={fullManualAddress}
          />

          <ProviderEmailMaybe provider={provider} isCustomer={isCustomer} />
        </div>
      </div>
    );
  }
  return null;
};

export default BookingLocationMaybe;
