import React, { useState, useEffect } from 'react';
import FieldTextInput from '../FieldTextInput/FieldTextInput';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { isNumber } from 'lodash';
import css from './CustomPriceInput.module.css';

function CustomPriceInput(props) {
  const {
    idNameField,
    label,
    form,
    valueField,
    currencyConfig,
    initialPriceValue,
    priceVal,
    values,
    placeholder,
    disabled,
    formatedshippingCharge,
    setFormatedShippingCharge,
    customValidationError,
    // perkPriceValidators,
    // correspondingPerkName,
  } = props;
  const { Money } = sdkTypes;
  // const [formatedPrice, setFormatedPrice] = useState(null);
  // const [formatedshippingCharge, setFormatedShippingCharge] = useState(null);
  const [fieldActive, setFieldActive] = useState({});

  useEffect(() => {
    // const initialshippingCharge = initialPriceValue?.amount ? initialPriceValue?.amount : null;
    if (!priceVal) {
      setFormatedShippingCharge(null);
    }
    const initialshippingCharge = priceVal?.amount ? priceVal?.amount : null;

    const currentShippingCharge = priceVal?.amount;

    if (initialshippingCharge !== formatedshippingCharge) {
      // console.log('first');
      if (isNumber(initialshippingCharge)) {
        form.change(idNameField, `$${Math.round(initialshippingCharge / 100)}.00`);
        form.change(valueField, priceVal);

        setFormatedShippingCharge(Math.round(initialshippingCharge / 100));
      }
    }
  }, [priceVal]);

  // useEffect(() => {
  //   perkPriceValidators(values.perkNameOne);
  // }, [values.perkNameOne]);

  // console.log(777, values);

  return (
    <div>
      {/* {console.log(989, values.perkNameOne)} */}
      <FieldTextInput
        id={idNameField}
        name={idNameField}
        type="text"
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        className={customValidationError ? css.errorInputBox : null}
        // className={classNames(css.inputs, {
        //   [css.invalidInputs]: touched.shippingChargeCustom && !!errors.shippingChargeCustom,
        //   [css.fnNonEmptyInputs]: !!values.shippingChargeCustom || fieldActive.shippingChargeCustom,
        // })}
        onChange={e => {
          const value = e.target.value;
          const regex = /^[0-9\b]+$/;
          if (value.match(regex) || value === '') {
            if (value) {
              form.change(
                valueField,
                new Money(
                  convertUnitToSubUnit(value, unitDivisor(currencyConfig.currency)),
                  currencyConfig.currency
                )
              );
            }
            form.change(idNameField, value);
            setFormatedShippingCharge(value);
            form.resetFieldState(idNameField);
          }
        }}
        onFocus={e => {
          form.change(idNameField, formatedshippingCharge);
          //   setFieldActive({ shippingChargeCustom: true });
        }}
        onBlur={e => {
          if (e.target.value) {
            form.change(idNameField, `$${Math.round(e.target.value)}.00`);
          }
          //   setFieldActive({ shippingChargeCustom: false });
          form.blur(idNameField);
          form.focus(idNameField);
        }}
      />
      <div className={css.errorInput}>{customValidationError}</div>
    </div>
  );
}

export default CustomPriceInput;
