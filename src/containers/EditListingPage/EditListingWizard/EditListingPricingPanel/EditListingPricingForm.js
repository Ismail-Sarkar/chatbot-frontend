import React, { useRef, useEffect } from 'react';
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
import {
  Button,
  Form,
  FieldCurrencyInput,
  FieldTextInput,
  FieldSelect,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingPricingForm.module.css';
import { useState } from 'react';
import { useConfiguration } from '../../../../context/configurationContext';
import CustomPriceInput from '../../../../components/CustomPriceInput/CustomPriceInput';

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
        initialValues,
        prefferedPaymentMethod,
        paymentMethodValues,
        onPrefferedPaymentMethodChange,
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
        editListingLinkType,
      } = formRenderProps;
      // console.log(3, listingMinimumPriceSubUnits);
      const PERK_MAX_LENGTH = 50;
      const VALID = undefined;

      const [formatedPerkNameOnePrice, setFormatedPerkNameOnePrice] = useState(null);
      const [formatedPerkNameTwoPrice, setFormatedPerkNameTwoPrice] = useState(null);
      const [formatedPerkNameThreePrice, setFormatedPerkNameThreePrice] = useState(null);

      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,

        marketplaceCurrency,
        intl
      );

      //
      // const perkValueRef = useRef(null);
      // useEffect(() => {
      //   perkValueRef.current = [];
      // }, []);

      const isNonEmptyString = val => {
        return typeof val === 'string' && val.trim().length > 0;
      };

      const perkpriceRequired = (message, value) => {
        if (typeof value === 'undefined' || value === null) {
          // undefined or null values are invalid
          return message;
        }
        if (typeof value === 'string') {
          // string must be nonempty when trimmed
          return isNonEmptyString(value) ? VALID : message;
        }
        return VALID;
      };

      const perkpriceValidator = (
        perkName,
        perkPrice,
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      ) => {
        if (typeof perkName === 'undefined' || perkName === '') return VALID;
        else {
          const priceRequiredMsgId = { id: 'EditListingPricingForm.priceRequired' };
          const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
          const priceRequired = perkpriceRequired(priceRequiredMsg, perkPrice);
          const minPriceRaw = new Money(listingMinimumPriceSubUnits * 100, marketplaceCurrency);
          const minPrice = formatMoney(intl, minPriceRaw);
          const priceTooLowMsgId = { id: 'EditListingPricingForm.priceTooLow' };
          const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
          const minPriceRequired =
            perkPrice &&
            parseFloat(perkPrice.toString().replace(/[^0-9.-]+/g, '')) >=
              listingMinimumPriceSubUnits
              ? VALID
              : priceTooLowMsg;

          // return listingMinimumPriceSubUnits
          //   ? validators.composeValidators(priceRequired, minPriceRequired)
          //   : priceRequired;
          // return listingMinimumPriceSubUnits
          //   ? validators.composeValidators(priceRequired, minPriceRequired)
          //   : priceRequired;

          return listingMinimumPriceSubUnits
            ? minPriceRequired
              ? minPriceRequired
              : priceRequired
            : priceRequired;
        }
      };

      // console.log(121, values, values.guests, values.reserVations);

      const perkPriceOneError = perkpriceValidator(
        values?.perkNameOne,
        values?.perkNameOnePrice,
        1,
        marketplaceCurrency,
        intl
      );

      const perkPriceTwoError = perkpriceValidator(
        values?.perkNameTwo,
        values?.perkNameTwoPrice,
        1,
        marketplaceCurrency,
        intl
      );

      const perkPriceThreeError = perkpriceValidator(
        values?.perkNameThree,
        values?.perkNameThreePrice,
        1,
        marketplaceCurrency,
        intl
      );

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        editListingLinkType !== 'edit'
          ? invalid || disabled || submitInProgress
          : typeof perkPriceOneError !== 'undefined' ||
            typeof perkPriceTwoError !== 'undefined' ||
            typeof perkPriceThreeError !== 'undefined' ||
            // (values.perkNameOne !== undefined && values.perkNameOnePrice === null) ||
            //   (values.perkNameTwo !== undefined && values.perkNameTwoPrice === null) ||
            //   (values.perkNameThree !== undefined && values.perkNameThreePrice === null) ||
            values.guests === undefined ||
            values.guests === '' ||
            values.reserVations === undefined ||
            values.reserVations === ''
          ? true
          : false;
      // (values.perkNameOne !== undefined && !values.perkNameOnePrice);
      // console.log(34, values.perkNameOne, values.perkNameOnePrice);
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
      const perkPriceValue = func => {
        func();
      };

      const required = validators.required('This field is required');

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
            Optional: Add up to 3 additional perks
            {/* (ex: Perk name: “unlimited coffee,” | Price:
            $25.00 USD) */}
          </div>
          <div className={css.perkNameExample}>
            ex: Perk name: unlimited coffee | Price: $25.00 USD<br></br>ex: Perk name: 1 hour
            Swedish massage | Price: $90.00 USD
          </div>
          <div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameOne"
                id="perkNameOne"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
                onChange={e => {
                  const perkNameOne = e.target.value;
                  form.change('perkNameOne', perkNameOne);
                  console.log(234, values.perkNameOne, perkNameOne);
                  if (perkNameOne === '') {
                    form.change('perkNameOnePrice', undefined);
                    form.change('perkNameOnePriceVal', undefined);
                    // perkValueRef.current = [...(perkValueRef.current || []), 'perkNameOnePrice'];
                  }
                }}
                // onBlur={e => {
                //   if ((e.target.value = '')) {
                //     form.blur(perkNameOnePrice);
                //     form.focus(perkNameOnePrice);
                //   }
                //   //   setFieldActive({ shippingChargeCustom: false });
                // }}
              />
              {/* <FieldCurrencyInput
                id="perkNameOnePrice"
                name="perkNameOnePrice"
                placeholder={values.perkNameOne !== undefined ? 'Price*' : 'price'}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameOne ? false : true}
                validate={perkPriceValidators(values.perkNameOne)}
                // perkValueRef={perkValueRef.current}
                // perkPriceValue={perkPriceValue}
              /> */}
              <CustomPriceInput
                idNameField="perkNameOnePrice"
                valueField="perkNameOnePriceVal"
                form={form}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                initialPriceValue={initialValues?.perkNameOnePrice}
                priceVal={values?.perkNameOnePrice}
                values={values}
                placeholder="Price"
                disabled={values.perkNameOne ? false : true}
                formatedshippingCharge={formatedPerkNameOnePrice}
                setFormatedShippingCharge={setFormatedPerkNameOnePrice}
                customValidationError={perkPriceOneError}
              />
            </div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameTwo"
                id="perkNameTwo"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
                onChange={e => {
                  const perkNameTwo = e.target.value;
                  form.change('perkNameTwo', perkNameTwo);
                  console.log(234, values.perkNameTwo, perkNameTwo);
                  if (perkNameTwo === '') {
                    form.change('perkNameTwoPrice', undefined);
                    form.change('perkNameTwoPriceVal', undefined);
                    // perkValueRef.current = [...(perkValueRef.current || []), 'perkNameOnePrice'];
                  }
                }}
              />
              {/* <FieldCurrencyInput
                id="perkNameTwoPrice"
                name="perkNameTwoPrice"
                placeholder={values.perkNameTwo !== undefined ? 'Price*' : 'Price'}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameTwo ? false : true}
                validate={perkPriceValidators(values.perkNameTwo)}
              /> */}
              <CustomPriceInput
                idNameField="perkNameTwoPrice"
                valueField="perkNameTwoPriceVal"
                form={form}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                initialPriceValue={initialValues?.perkNameTwoPrice}
                priceVal={values?.perkNameTwoPrice}
                values={values}
                placeholder="Price"
                disabled={values.perkNameTwo ? false : true}
                formatedshippingCharge={formatedPerkNameTwoPrice}
                setFormatedShippingCharge={setFormatedPerkNameTwoPrice}
                customValidationError={perkPriceTwoError}
              />
            </div>
            <div className={css.perksField}>
              <FieldTextInput
                type="text"
                name="perkNameThree"
                id="perkNameThree"
                placeholder="Perk Name"
                maxLength={PERK_MAX_LENGTH}
                onChange={e => {
                  const perkNameThree = e.target.value;
                  form.change('perkNameThree', perkNameThree);
                  console.log(234, values.perkNameThree, perkNameThree);
                  if (perkNameThree === '') {
                    form.change('perkNameThreePrice', undefined);
                    form.change('perkNameThreePriceVal', undefined);
                    // perkValueRef.current = [...(perkValueRef.current || []), 'perkNameOnePrice'];
                  }
                }}
              />
              {/* <FieldCurrencyInput
                id="perkNameThreePrice"
                name="perkNameThreePrice"
                placeholder={values.perkNameThree !== undefined ? 'Price*' : 'Price'}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                disabled={values.perkNameThree ? false : true}
                validate={perkPriceValidators(values.perkNameThree)}
              /> */}
              <CustomPriceInput
                idNameField="perkNameThreePrice"
                valueField="perkNameThreePriceVal"
                form={form}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                initialPriceValue={initialValues?.perkNameThreePrice}
                priceVal={values?.perkNameThreePrice}
                values={values}
                placeholder="Price"
                disabled={values.perkNameThree ? false : true}
                formatedshippingCharge={formatedPerkNameThreePrice}
                setFormatedShippingCharge={setFormatedPerkNameThreePrice}
                customValidationError={perkPriceThreeError}
              />
            </div>
          </div>
          <div className={classNames(css.optionalPerkFee, css.GuestOption)}>Guests</div>
          <FieldTextInput
            className={css.guests}
            type="number"
            name="guests"
            id="guests"
            label="Enter the maximum total number of guests you’ll accept per reservation*"
            placeholder="Enter"
            onChange={restrictText}
            validate={required}
          />
          <FieldTextInput
            className={css.guests}
            type="number"
            name="reserVations"
            id="reserVations"
            label="Enter the maximum number of reservations you’ll accept per day*"
            placeholder="Enter"
            onChange={restrictTextReservation}
            validate={required}
          />
          <FieldSelect
            id="prefferedPaymentMethod"
            name="prefferedPaymentMethod"
            className={css.listingTypeSelect}
            label={intl.formatMessage({ id: 'EditListingPricingForm.paymentMethodTitle' })}
            validate={validators.required(
              intl.formatMessage({ id: 'EditListingPricingForm.paymentMethodRequired' })
            )}
          >
            <option disabled value="">
              {intl.formatMessage({ id: 'EditListingPricingForm.paymentMethodPlaceholder' })}
            </option>
            {paymentMethodValues.map(({ option, label }) => {
              return (
                <option key={option} value={option}>
                  {label}
                </option>
              );
            })}
          </FieldSelect>

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
