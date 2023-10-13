import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingForm from './EditListingPricingForm';
import css from './EditListingPricingPanel.module.css';
import { convertUnitToSubUnit, unitDivisor } from '../../../../util/currency';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
} from '../../../../util/urlHelpers';

const { Money } = sdkTypes;

const getInitialValues = params => {
  const { listing } = params;
  const { price } = listing?.attributes || {};
  const {
    perkNameOne,
    perkNameOnePrice,
    perkNameTwo,
    perkNameTwoPrice,
    perkNameThree,
    perkNameThreePrice,
    guests,
    reserVations,
  } = listing?.attributes?.publicData;

  return {
    price,
    perkNameOne,
    perkNameOnePrice: perkNameOnePrice?.amount
      ? new Money(perkNameOnePrice?.amount, perkNameOnePrice?.currency)
      : null,
    perkNameTwo,
    perkNameTwoPrice: perkNameTwoPrice?.amount
      ? new Money(perkNameTwoPrice?.amount, perkNameTwoPrice?.currency)
      : null,
    perkNameThree,
    perkNameThreePrice: perkNameThreePrice?.amount
      ? new Money(perkNameThreePrice?.amount, perkNameThreePrice?.currency)
      : null,
    guests,
    reserVations,
  };
};

const EditListingPricingPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = getInitialValues(props);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const isDraft = listing?.attributes?.state === LISTING_STATE_DRAFT;
  const editListingLinkType = isDraft
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;
  const priceCurrencyValid =
    initialValues.price instanceof Money
      ? initialValues.price.currency === marketplaceCurrency
      : true;
  const unitType = listing?.attributes?.publicData?.unitType;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingPricingPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPricingPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      {priceCurrencyValid ? (
        <EditListingPricingForm
          className={css.form}
          initialValues={initialValues}
          onSubmit={values => {
            const {
              price,
              perkNameOnePrice,
              perkNameOne,
              perkNameTwo,
              perkNameTwoPrice,
              perkNameThree,
              perkNameThreePrice,
              guests,
              reserVations,
            } = values;
            console.log(445, values);
            // New values for listing attributes
            const updateValues = {
              price,
              publicData: {
                listingPrice: {
                  amount: price.amount,
                  currency: price.currency,
                },
                perkNameOne: perkNameOne ? perkNameOne : null,
                perkNameOnePrice: perkNameOnePrice
                  ? { amount: perkNameOnePrice.amount, currency: perkNameOnePrice.currency }
                  : null,
                perkNameTwo: perkNameTwo ? perkNameTwo : null,
                perkNameTwoPrice: perkNameTwoPrice
                  ? { amount: perkNameTwoPrice.amount, currency: perkNameTwoPrice.currency }
                  : null,
                perkNameThree: perkNameThree ? perkNameThree : null,
                perkNameThreePrice: perkNameThreePrice
                  ? { amount: perkNameThreePrice.amount, currency: perkNameThreePrice.currency }
                  : null,
                guests: guests ? guests : null,
                reserVations: reserVations ? reserVations : null,
              },
            };

            onSubmit(updateValues);
          }}
          marketplaceCurrency={marketplaceCurrency}
          unitType={unitType}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
          editListingLinkType={editListingLinkType}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage id="EditListingPricingPanel.listingPriceCurrencyInvalid" />
        </div>
      )}
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingPricingPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingPricingPanel.propTypes = {
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

export default EditListingPricingPanel;
