import React from 'react';
import { intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { humanizeLineItemCode } from '../../util/data';
import {
  LINE_ITEMS,
  LINE_ITEM_CUSTOM,
  LINE_ITEM_CUSTOM_GUEST_PRICE,
  propTypes,
} from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';

import css from './OrderBreakdown.module.css';
import moment from 'moment';
import { isEmpty } from 'lodash';

const { Money } = sdkTypes;

function LineItemGuestFeeMaybe(props) {
  const { lineItems, transaction, intl } = props;
  const guestFeeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_CUSTOM_GUEST_PRICE && !item.reversal
  );

  // resolve unknown non-reversal line items
  const customItem = transaction.attributes.lineItems.find(
    item => item.code === LINE_ITEM_CUSTOM_GUEST_PRICE && !item.reversal
  );

  const { lineTotal, unitPrice } = customItem || {};
  const totalUnit = lineTotal && lineTotal.amount / unitPrice.amount;
  const formattedLabel = (label, quantity) =>
    quantity && quantity > 0
      ? `${humanizeLineItemCode(label)} x ${quantity}`
      : humanizeLineItemCode(label);

  const bookingLineItem = guestFeeLineItem
    ? [
        {
          key: 'seats',
          label: formattedLabel(`line-item/price-per-person`),
          formattedMoneyLabel: formatMoney(
            intl,
            new Money(unitPrice?.amount, unitPrice?.currency || 'USD')
          ),
        },
      ]
    : [];

  guestFeeLineItem &&
    bookingLineItem.push({
      key: 'seats',
      label: `x total ${totalUnit} of people`,
      formattedMoneyLabel: formatMoney(
        intl,
        new Money(lineTotal?.amount, lineTotal?.currency || 'USD')
      ),
    });

  return (
    <React.Fragment>
      {guestFeeLineItem && (
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
        </div>
      )}
    </React.Fragment>
  );
}

export default LineItemGuestFeeMaybe;
