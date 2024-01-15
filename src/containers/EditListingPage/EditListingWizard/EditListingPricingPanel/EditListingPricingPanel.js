import React, { useState } from 'react';
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
import { useConfiguration } from '../../../../context/configurationContext';

const { Money } = sdkTypes;

// const paymentMethodvalues = [
//   { key: 'creditDebitCash', label: 'Credit/debit card & cash' },
//   { key: 'creditDebit', label: 'Credit/debit card only' },
//   { key: 'cash', label: 'Cash only' },
// ];

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
    prefferedPaymentMethod,
    preferredCurrency,
    currency,
  } = listing?.attributes?.publicData;

  // const selectedPrefferedPaymentMethod = paymentMethodvalues.find((elem)=>elem.value===)

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
    prefferedPaymentMethod: prefferedPaymentMethod,
    preferredCurrency: preferredCurrency ?? 'USD',
    currency: preferredCurrency === 'USD' ? 'USD' : currency,
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

  const config = useConfiguration();

  const { availablePaymentMethods } = config.listing || {};

  // const { enumOptions: paymentMethodValues } = config.listing.listingFields.find(
  //   ({ key }) => key === 'paymentMethodValues'
  // );

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
          paymentMethodValues={availablePaymentMethods}
          onSubmit={values => {
            const {
              price,
              perkNameOnePrice,
              perkNameOnePriceVal,
              perkNameOne,
              perkNameTwo,
              perkNameTwoPrice,
              perkNameTwoPriceVal,
              perkNameThree,
              perkNameThreePrice,
              perkNameThreePriceVal,
              guests,
              reserVations,
              prefferedPaymentMethod,
              preferredCurrency,
              currency,
            } = values;
            // console.log(445, values, prefferedPaymentMethod);
            // New values for listing attributes

            const newAvailabitiyPlan =
              listing?.attributes?.publicData?.reserVations !== reserVations &&
              listing?.attributes?.availabilityPlan?.type === 'availability-plan/time'
                ? {
                    ...listing?.attributes?.availabilityPlan,
                    entries: listing?.attributes?.availabilityPlan?.entries?.map(entry => {
                      return {
                        ...entry, // Spread the original entry
                        seats: parseInt(reserVations), // Update the "seats" property to reserVations
                      };
                    }),
                  }
                : listing?.attributes?.availabilityPlan;

            const updateValues = {
              price,
              availabilityPlan: newAvailabitiyPlan,
              publicData: {
                prefferedPaymentMethod: prefferedPaymentMethod,
                preferredCurrency,
                currency: preferredCurrency === 'USD' ? 'USD' : currency,
                listingPrice: {
                  amount: price.amount,
                  currency: price.currency,
                },
                perkNameOne: perkNameOne ? perkNameOne : null,
                // perkNameOnePrice: perkNameOnePrice
                //   ? { amount: perkNameOnePrice.amount, currency: perkNameOnePrice.currency }
                //   : null,
                perkNameOnePrice: perkNameOnePriceVal
                  ? { amount: perkNameOnePriceVal.amount, currency: perkNameOnePriceVal.currency }
                  : null,
                perkNameTwo: perkNameTwo ? perkNameTwo : null,
                // perkNameTwoPrice: perkNameTwoPrice
                //   ? { amount: perkNameTwoPrice.amount, currency: perkNameTwoPrice.currency }
                //   : null,
                perkNameTwoPrice: perkNameTwoPriceVal
                  ? { amount: perkNameTwoPriceVal.amount, currency: perkNameTwoPriceVal.currency }
                  : null,
                perkNameThree: perkNameThree ? perkNameThree : null,
                // perkNameThreePrice: perkNameThreePrice
                //   ? { amount: perkNameThreePrice.amount, currency: perkNameThreePrice.currency }
                //   : null,
                perkNameThreePrice: perkNameThreePriceVal
                  ? {
                      amount: perkNameThreePriceVal.amount,
                      currency: perkNameThreePriceVal.currency,
                    }
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
