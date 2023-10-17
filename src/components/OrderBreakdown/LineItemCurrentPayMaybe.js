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

const { Money } = sdkTypes;

function LineItemCurrentPayMaybe(props) {
  const { lineItems, transaction, intl, isProvider } = props;

  const { lineTotal } = serviceFeeLineItem || {};
  const formattedLabel = (label, quantity) =>
    quantity && quantity > 0
      ? `${humanizeLineItemCode(label)} x ${quantity}`
      : humanizeLineItemCode(label);

  const bookingLineItem = [
    {
      key: 'seats',
      label: formattedLabel(`line-item/current-payment`),
      formattedMoneyLabel: formatMoney(
        intl,
        new Money(lineTotal?.amount, lineTotal?.currency || 'USD')
      ),
    },
  ];

  const totalPrice = isProvider
    ? transaction.attributes.payoutTotal
    : transaction.attributes.payinTotal;
  const formattedTotalPrice = formatMoney(intl, totalPrice);

  return (
    <React.Fragment>
      <hr className={css.totalDivider} />

      {bookingLineItem.map(({ label, formattedMoneyLabel, key }, i) => (
        <div key={`item.code+${i}`}>
          {/* {(key === 'subTotal' || key === 'seats') && <hr className={css.totalDivider} />} */}
          <div className={css.lineItem}>
            <span className={css.itemLabel}>{label}</span>
            <span className={css.itemValue}>{formattedMoneyLabel}</span>
          </div>
        </div>
      ))}
      {/* <hr className={css.totalDivider} /> */}
    </React.Fragment>
  );
}

export default LineItemCurrentPayMaybe;
