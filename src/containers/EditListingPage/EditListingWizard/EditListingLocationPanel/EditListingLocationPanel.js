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
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../../../util/urlHelpers';

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
    street: street ? street : null,
    cityStateCountry: cityStateCountry ? cityStateCountry : null,
    zip: zip ? zip : null,
    manualAddress: manualAddress ? manualAddress : false,
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
    history,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes.state !== LISTING_STATE_DRAFT;
  // const isDraft = listing?.attributes.state === LISTING_STATE_DRAFT;
  // const id = listing.id.uuid;
  const { title = '' } = listing.attributes;
  // const slug = createSlug(title);
  // const editListingLinkType = isDraft
  //   ? LISTING_PAGE_PARAM_TYPE_DRAFT
  //   : LISTING_PAGE_PARAM_TYPE_EDIT;
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
          const {
            building = '',
            location,
            mapLocation,
            manualAddress,
            street,
            cityStateCountry,
            zip,
          } = values;
          if (Object.keys(location || {}).length !== 0) {
            const {
              selectedPlace: { address, origin },
            } = location;

            // New values for listing attributes
            const updateValues = {
              geolocation: origin,
              publicData: {
                location: {
                  address,
                  building,
                },
                mapLocation: {
                  country: mapLocation.country ? mapLocation.country.text : null,
                  state: mapLocation.state ? mapLocation.state.text : null,
                  district: mapLocation.district ? mapLocation.district.text : null,
                },
                manualAddress: false,
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
                mapLocation: null,
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
                building,
                street: street ? street : null,
                cityStateCountry: cityStateCountry ? cityStateCountry : null,
                zip: zip ? zip : null,
                // manualAddress: manualAddress ? manualAddress : false,
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
        // id={id}
        // slug={slug}
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
