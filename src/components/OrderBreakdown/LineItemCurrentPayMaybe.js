import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney, unitDivisor } from '../../util/currency';
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
import { isArray, isEmpty } from 'lodash';
import appSettings from '../../config/settings';
import { useConfiguration } from '../../context/configurationContext';

const { Money } = sdkTypes;

const marketplaceCurrency = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;

function LineItemCurrentPayMaybe(props) {
  const { lineItems, transaction, intl, isProvider } = props;
  const config = useConfiguration();
  const { currencyList } = config.listing || {};

  const { protectedData } = transaction.attributes || {};

  const { exchangeCode, acceptedCurrency: currency } = protectedData || {};

  const { value: currencyLabel } =
    (isArray(currencyList) && currencyList.find(({ key }) => key === currency)) || {};

  const currentPayFeeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_CURRENT_PAY && !item.reversal
  );
  const { lineTotal } = currentPayFeeLineItem || {};

  const formattedMoneyLabel =
    lineTotal &&
    lineTotal.amount &&
    lineTotal.currency &&
    formatMoney(intl, new Money(Math.abs(lineTotal?.amount), lineTotal?.currency || 'USD'));

  const absoluteCurrency =
    lineTotal?.amount &&
    marketplaceCurrency &&
    Math.abs(lineTotal?.amount / unitDivisor(marketplaceCurrency));

  return lineTotal && lineTotal.amount && lineTotal.currency ? (
    <div className={isProvider ? css.providerRemainingPay : css.remainingPay}>
      {isProvider ? (
        exchangeCode && currency && currencyLabel && currency !== 'USD' ? (
          <FormattedMessage
            id="OrderBreakdown.remainingFeeProvider"
            values={{
              remainingFee: `${(absoluteCurrency * exchangeCode).toFixed(2)} ${currencyLabel}`,
            }}
          />
        ) : (
          <FormattedMessage
            id="OrderBreakdown.remainingFeeProvider"
            values={{
              remainingFee: `${formattedMoneyLabel} USD`,
            }}
          />
        )
      ) : (
        <>
          {exchangeCode && currency && currencyLabel && currency !== 'USD' ? (
            <FormattedMessage
              id="OrderBreakdown.remainingFeeCustomerForeignCurrency"
              values={{ remainingFee: formattedMoneyLabel }}
            />
          ) : (
            <FormattedMessage
              id="OrderBreakdown.remainingFeeCustomer"
              values={{ remainingFee: formattedMoneyLabel }}
            />
          )}

          <br />
          {exchangeCode && currency && currencyLabel && currency !== 'USD' && (
            <div className={css.convertedRate}>
              <strong>{`${(absoluteCurrency * exchangeCode).toFixed(2)} ${currencyLabel}`}</strong>
            </div>
          )}
        </>
      )}
    </div>
  ) : null;
}

export default LineItemCurrentPayMaybe;
