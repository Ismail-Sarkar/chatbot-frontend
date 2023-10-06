import React from 'react';
import { bool, func, number, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { Button, Form, FieldCurrencyInput, FieldTextInput } from '../../../../components';

// Import modules from this directory
import css from './EditListingPricingForm.module.css';

const { Money } = sdkTypes;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};
// const getPeakPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
//   const priceRequiredMsgId = { id: 'EditListingPricingForm.priceRequired' };
//   const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
//   const priceRequired = validators.required(priceRequiredMsg);

//   const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
//   const minPrice = formatMoney(intl, minPriceRaw);
//   const priceTooLowMsgId = { id: 'EditListingPricingForm.priceTooLow' };
//   const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
//   const minPriceRequired = validators.moneySubUnitAmountAtLeast(
//     priceTooLowMsg,
//     listingMinimumPriceSubUnits
//   );

//   return listingMinimumPriceSubUnits
//     ? validators.composeValidators(priceRequired, minPriceRequired)
//     : priceRequired;
// };
export const EditListingPricingFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        marketplaceCurrency,
        unitType,
        listingMinimumPriceSubUnits,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        form,
        errors,
      } = formRenderProps;
      // console.log(3, listingMinimumPriceSubUnits);
      const PERK_MAX_LENGTH = 70;

      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,

        marketplaceCurrency,
        intl
      );
      const perkPriceValidators = perkName => {
        if (perkName === undefined) {
          return null;
        }
        return getPriceValidators(1, marketplaceCurrency, intl);
      };
      //

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      // (values.perkNameOne !== undefined && !values.perkNameOnePrice);
      console.log(
        34,
        values.perkNameOne !== undefined &&
          !values.perkNameOnePrice &&
          (values.perkNameTwo !== undefined && !values.perkNameTwoPrice)
      );
      const { updateListingError, showListingsError } = fetchErrors || {};
      const restrictText = e => {
        const value = e.target.value;

        // Use a regular expression to allow only numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        form.change('guests', numericValue);
      };
      const restrictTextReservation = e => {
        const value = e.target.value;

        // Use a regular expression to allow only numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        form.change('reserVations', numericValue);
      };
      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.showListingFailed" />
            </p>
          ) : null}
          <FieldCurrencyInput
            id={`${formId}price`}
            name="price"
            className={css.input}
            autoFocus={autoFocus}
            label={intl.formatMessage(
              { id: 'EditListingPricingForm.pricePerProduct' },
              { unitType }
            )}
            placeholder={intl.formatMessage({ id: 'EditListingPricingForm.priceInputPlaceholder' })}
            currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
            validate={priceValidators}
          />
          <div className={css.optionalPerkFee}>
            Optional: Add up to 3 additional perks (ex: Perk name: “unlimited coffee,” | Price:
            $25.00 USD)
          </div>
          <div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameOne"
                id="perkNameOne"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
              />
              <FieldCurrencyInput
                id="perkNameOnePrice"
                name="perkNameOnePrice"
                placeholder="Price"
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameOne ? false : true}
                validate={perkPriceValidators(values.perkNameOne)}
              />
            </div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameTwo"
                id="perkNameTwo"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
              />
              <FieldCurrencyInput
                id="perkNameTwoPrice"
                name="perkNameTwoPrice"
                placeholder="Price"
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameTwo ? false : true}
                validate={perkPriceValidators(values.perkNameTwo)}
              />
            </div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameThree"
                id="perkNameThree"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
              />
              <FieldCurrencyInput
                id="perkNameThreePrice"
                name="perkNameThreePrice"
                placeholder="Price"
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameThree ? false : true}
                validate={perkPriceValidators(values.perkNameThree)}
              />
            </div>
          </div>
          <div className={css.optionalPerkFee}>Guests</div>
          <FieldTextInput
            className={css.guests}
            type="text"
            name="guests"
            id="guests"
            label="Enter the maximum total number of guests you’ll accept per reservation"
            placeholder="Enter"
            onChange={restrictText}
          />
          <FieldTextInput
            className={css.guests}
            type="text"
            name="reserVations"
            id="reserVations"
            label="Enter the maximum number of reservations you’ll accept per day"
            placeholder="Enter"
            onChange={restrictTextReservation}
          />

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingPricingFormComponent.defaultProps = {
  fetchErrors: null,
  listingMinimumPriceSubUnits: 0,
  formId: 'EditListingPricingForm',
};

EditListingPricingFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  marketplaceCurrency: string.isRequired,
  unitType: string.isRequired,
  listingMinimumPriceSubUnits: number,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingPricingFormComponent);
