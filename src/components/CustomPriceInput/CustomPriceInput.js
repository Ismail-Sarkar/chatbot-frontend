import React, { useState, useEffect } from 'react';
import FieldTextInput from '../FieldTextInput/FieldTextInput';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { isNumber } from 'lodash';

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
  } = props;
  const { Money } = sdkTypes;
  const [formatedPrice, setFormatedPrice] = useState(null);
  const [formatedshippingCharge, setFormatedShippingCharge] = useState(null);
  const [fieldActive, setFieldActive] = useState({});

  useEffect(() => {
    const initialshippingCharge = initialPriceValue?.amount ? initialPriceValue?.amount : null;

    const currentShippingCharge = priceVal?.amount;
    console.log(
      787,
      initialshippingCharge !== formatedshippingCharge,
      formatedshippingCharge,
      priceVal
    );
    if (initialshippingCharge !== formatedshippingCharge) {
      if (isNumber(initialshippingCharge)) {
        form.change(idNameField, `$${Math.round(initialshippingCharge / 100)}.00`);
        setFormatedShippingCharge(Math.round(initialshippingCharge / 100));
      }
    }
  }, [priceVal]);

  console.log(777, initialPriceValue, priceVal, values);

  return (
    <div>
      <FieldTextInput
        id={idNameField}
        name={idNameField}
        type="text"
        label={label}
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
        }}
      />
    </div>
  );
}

export default CustomPriceInput;
