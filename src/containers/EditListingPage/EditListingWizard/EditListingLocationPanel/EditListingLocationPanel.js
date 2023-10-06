import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingLocationForm from './EditListingLocationForm';
import css from './EditListingLocationPanel.module.css';

const getInitialValues = props => {
  const { listing } = props;
  const { geolocation, publicData } = listing?.attributes || {};

  // Only render current search if full place object is available in the URL params
  // TODO bounds are missing - those need to be queried directly from Google Places
  const locationFieldsPresent = publicData?.location?.address && geolocation;
  const location = publicData?.location || {};
  const { address, building } = location;
  const fullManualAddress = publicData?.fullManualAddress || {};
  const { cityStateCountry, street, zip } = fullManualAddress;
  const manualAddress = publicData.manualAddress;
  return {
    building,
    location: locationFieldsPresent
      ? {
          search: address,
          selectedPlace: { address, origin: geolocation },
        }
      : null,
    street: street ?? '',
    cityStateCountry: cityStateCountry ?? '',
    zip: zip ?? '',
    manualAddress: manualAddress ?? false,
  };
};

const EditListingLocationPanel = props => {
  // State is needed since LocationAutocompleteInput doesn't have internal state
  // and therefore re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    tab,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingLocationPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingLocationPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingLocationForm
        className={css.form}
        initialValues={state.initialValues}
        onSubmit={values => {
          const { building = '', location, manualAddress, street, cityStateCountry, zip } = values;
          console.log(67, values);
          if (Object.keys(location || {}).length !== 0) {
            const {
              selectedPlace: { address, origin },
            } = location;

            // New values for listing attributes
            const updateValues = {
              geolocation: origin,
              publicData: {
                location: { address, building },
                manualAddress: null,
                fullManualAddress: null,
              },
            };
            // Save the initialValues to state
            // LocationAutocompleteInput doesn't have internal state
            // and therefore re-rendering would overwrite the values during XHR call.
            setState({
              initialValues: {
                building,
                location: { search: address, selectedPlace: { address, origin } },
              },
            });
            onSubmit(updateValues);
          } else {
            const updateValues = {
              publicData: {
                location: null,
                manualAddress,
                fullManualAddress: manualAddress
                  ? {
                      street: street,
                      cityStateCountry: cityStateCountry,
                      zip: zip,
                    }
                  : null,
              },
            };
            setState({
              initialValues: {
                manualAddress: manualAddress,
                fullManualAddress: {
                  street: street,
                  cityStateCountry: cityStateCountry,
                  zip: zip,
                },
              },
            });
            onSubmit(updateValues);
          }

          //  else if  const updateValues = {
          //     publicData: {
          //       location: { address, building },
          //     },
          //   };
          // onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        tab={tab}
        autoFocus
      />
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingLocationPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingLocationPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingLocationPanel;
