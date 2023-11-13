import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
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

  const currentPayFeeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_CURRENT_PAY && !item.reversal
  );
  const { lineTotal } = currentPayFeeLineItem || {};

  const formattedMoneyLabel =
    lineTotal &&
    lineTotal.amount &&
    lineTotal.currency &&
    formatMoney(intl, new Money(Math.abs(lineTotal?.amount), lineTotal?.currency || 'USD'));

  return lineTotal && lineTotal.amount && lineTotal.currency ? (
    <div className={css.remainingPay}>
      {isProvider ? (
        <FormattedMessage
          id="OrderBreakdown.remainingFeeProvider"
          values={{ remainingFee: formattedMoneyLabel }}
        />
      ) : (
        <FormattedMessage
          id="OrderBreakdown.remainingFeeCustomer"
          values={{ remainingFee: formattedMoneyLabel }}
        />
      )}
    </div>
  ) : null;
}

export default LineItemCurrentPayMaybe;
