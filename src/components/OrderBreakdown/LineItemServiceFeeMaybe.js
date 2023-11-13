import React from 'react';
import { intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { humanizeLineItemCode } from '../../util/data';
import {
  LINE_ITEMS,
  LINE_ITEM_CURRENT_PAY,
  LINE_ITEM_CUSTOM,
  LINE_ITEM_CUSTOM_GUEST_PRICE,
  LINE_ITEM_SERVICE_FEE,
  propTypes,
} from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';

import css from './OrderBreakdown.module.css';
import moment from 'moment';
import { isEmpty } from 'lodash';

const lineItemsNotInclueded = ['line-item/current-pay'];

const { Money } = sdkTypes;

function LineItemServiceFeeMaybe(props) {
  const { lineItems, transaction, intl, isProvider } = props;
  const serviceFeeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_SERVICE_FEE && !item.reversal
  );
  const allFilteredLineItems = lineItems
    .filter(item => item.code !== LINE_ITEM_SERVICE_FEE && !item.reversal)
    .filter(item => item.code !== LINE_ITEM_CURRENT_PAY && !item.reversal);

  const subTotalAmount = allFilteredLineItems.reduce((acc, curr) => {
    acc += curr.lineTotal.amount;
    return acc;
  }, 0);

  const { lineTotal } = serviceFeeLineItem || {};
  const formattedLabel = (label, quantity) =>
    quantity && quantity > 0
      ? `${humanizeLineItemCode(label)} x ${quantity}`
      : humanizeLineItemCode(label);

  const bookingLineItem = [
    {
      key: 'subtotal',
      label: formattedLabel(`line-item/subtotal`),
      formattedMoneyLabel: formatMoney(
        intl,
        new Money(subTotalAmount, lineTotal?.currency || 'USD')
      ),
    },
    {
      key: 'seats',
      label: formattedLabel(`line-item/service-fee`),
      formattedMoneyLabel: formatMoney(
        intl,
        new Money(lineTotal?.amount, lineTotal?.currency || 'USD')
      ),
    },
  ];

  const getCustomerTotalPrice = lineItems => {
    const priceObj = lineItems
      .filter(lineItem => !lineItemsNotInclueded.includes(lineItem.code))
      .reduce((prev, curnt) => {
        prev.currency = curnt.lineTotal.currency;
        if (prev.amount === undefined) {
          prev.amount = 0;
        }
        prev.amount += curnt.lineTotal.amount;
        return prev;
      }, {});
    return new Money(priceObj.amount, priceObj.currency);
  };

  const totalPrice = isProvider
    ? transaction.attributes.payoutTotal
    : getCustomerTotalPrice(lineItems);
  const formattedTotalPrice = formatMoney(intl, totalPrice);

  return (
    <React.Fragment>
      {/* <hr className={css.totalDivider} /> */}
      <div className={css.seperator}>
        {bookingLineItem.map(({ label, formattedMoneyLabel, key }, i) => (
          <div key={`item.code+${i}`}>
            {/* {(key === 'subTotal' || key === 'seats') && <hr className={css.totalDivider} />} */}
            <div className={css.lineItem}>
              <span className={css.itemLabel}>{label}</span>
              <span className={css.itemValue}>{formattedMoneyLabel}</span>
            </div>
          </div>
        ))}
        <div className={css.lineItem}>
          <span className={css.itemLabel}>{'Total price'}</span>
          <span className={css.itemValue}>{formattedTotalPrice}</span>
        </div>
      </div>
    </React.Fragment>
  );
}

export default LineItemServiceFeeMaybe;
