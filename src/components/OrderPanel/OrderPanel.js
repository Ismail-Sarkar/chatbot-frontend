import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  array,
  arrayOf,
  bool,
  func,
  node,
  number,
  object,
  oneOfType,
  shape,
  string,
} from 'prop-types';
import loadable from '@loadable/component';
import classNames from 'classnames';
import omit from 'lodash/omit';
import { types as sdkTypes } from '../../util/sdkLoader';

import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import {
  propTypes,
  LISTING_STATE_CLOSED,
  LINE_ITEM_NIGHT,
  LINE_ITEM_DAY,
  LINE_ITEM_ITEM,
  LINE_ITEM_HOUR,
} from '../../util/types';
import { convertMoneyToNumber, formatMoney } from '../../util/currency';
import { parse, stringify } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import {
  INQUIRY_PROCESS_NAME,
  getSupportedProcessesInfo,
  isBookingProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

import { ModalInMobile, PrimaryButton, AvatarSmall, H1, H2 } from '../../components';

import css from './OrderPanel.module.css';

const BookingTimeForm = loadable(() =>
  import(/* webpackChunkName: "BookingTimeForm" */ './BookingTimeForm/BookingTimeForm')
);
const BookingDatesForm = loadable(() =>
  import(/* webpackChunkName: "BookingDatesForm" */ './BookingDatesForm/BookingDatesForm')
);
const InquiryWithoutPaymentForm = loadable(() =>
  import(
    /* webpackChunkName: "InquiryWithoutPaymentForm" */ './InquiryWithoutPaymentForm/InquiryWithoutPaymentForm'
  )
);
const ProductOrderForm = loadable(() =>
  import(/* webpackChunkName: "ProductOrderForm" */ './ProductOrderForm/ProductOrderForm')
);

// This defines when ModalInMobile shows content as Modal
const MODAL_BREAKPOINT = 1023;
const TODAY = new Date();

const { Money } = sdkTypes;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

const openOrderModal = (isOwnListing, isClosed, history, location) => {
  if (isOwnListing || isClosed) {
    window.scrollTo(0, 0);
  } else {
    const { pathname, search, state } = location;
    const searchString = `?${stringify({ ...parse(search), orderOpen: true })}`;
    history.push(`${pathname}${searchString}`, state);
  }
};

const closeOrderModal = (history, location) => {
  const { pathname, search, state } = location;
  const searchParams = omit(parse(search), 'orderOpen');
  const searchString = `?${stringify(searchParams)}`;
  history.push(`${pathname}${searchString}`, state);
};

const handleSubmit = (
  isOwnListing,
  isClosed,
  isInquiryWithoutPayment,
  onSubmit,
  history,
  location
) => {
  // TODO: currently, inquiry-process does not have any form to ask more order data.
  // We can submit without opening any inquiry/order modal.
  return isInquiryWithoutPayment
    ? () => onSubmit({})
    : () => openOrderModal(isOwnListing, isClosed, history, location);
};

const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const PriceMaybe = props => {
  const { price, publicData, validListingTypes, intl } = props;
  const { listingType, unitType, availableStartTime, availableEndTime } = publicData || {
    availableStartTime: { label: {} },
    availableEndTime: { label: {} },
  };
  const { label: startTimeLabel } = availableStartTime || {};
  const { label: endTimeLabel } = availableEndTime || {};

  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice || !price) {
    return null;
  }

  return (
    <>
      <div className={css.priceContainer}>
        <p className={css.price}>
          {formatMoney(intl, price)} {price?.currency}
        </p>
        {/* <div className={css.perUnit}>
          <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
        </div> */}
      </div>
      {startTimeLabel && endTimeLabel && (
        <div className={css.durationMainDiv}>
          <div className={css.timeDuration}>Duration</div>
          <div
            className={css.timeDuration}
          >{`${publicData.availableStartTime?.label}-${publicData.availableEndTime?.label}`}</div>
        </div>
      )}
    </>
  );
};

const OrderPanel = props => {
  const {
    rootClassName,
    className,
    titleClassName,
    listing,
    validListingTypes,
    lineItemUnitType: lineItemUnitTypeMaybe,
    isOwnListing,
    onSubmit,
    title,
    titleDesktop,
    author,
    authorLink,
    onManageDisableScrolling,
    onFetchTimeSlots,
    monthlyTimeSlots,
    history,
    location,
    intl,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    marketplaceCurrency,
    dayCountAvailableForBooking,
    marketplaceName,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    listingTimeZone,
    currentUser,
  } = props;

  const listingPublicData = listing?.attributes?.publicData;

  const perkNameOnePrice = formatMoney(
    intl,
    new Money(
      listingPublicData?.perkNameOnePrice?.amount ||
        // chatItem.chat.payableAmmount.amount ||
        0,
      'USD'
    )
  );
  const perkNameTwoPrice = formatMoney(
    intl,
    new Money(
      listingPublicData?.perkNameTwoPrice?.amount ||
        // chatItem.chat.payableAmmount.amount ||
        0,
      'USD'
    )
  );
  const perkNameThreePrice = formatMoney(
    intl,
    new Money(
      listingPublicData?.perkNameThreePrice?.amount ||
        // chatItem.chat.payableAmmount.amount ||
        0,
      'USD'
    )
  );

  let extraParkValues = [];
  if (listingPublicData.perkNameOne && listingPublicData?.perkNameOnePrice) {
    extraParkValues.push({
      key: `${listingPublicData?.perkNameOne}/${perkNameOnePrice}`,
      label: `${listingPublicData?.perkNameOne}/${perkNameOnePrice}`,
      value: convertMoneyToNumber(
        new Money(listingPublicData?.perkNameOnePrice?.amount || 0, 'USD')
      ),
    });
  }
  if (listingPublicData.perkNameTwo && listingPublicData?.perkNameTwoPrice) {
    extraParkValues.push({
      key: `${listingPublicData?.perkNameTwo}/${perkNameTwoPrice}`,
      label: `${listingPublicData?.perkNameTwo}/${perkNameTwoPrice}`,
      value: convertMoneyToNumber(
        new Money(listingPublicData?.perkNameTwoPrice?.amount || 0, 'USD')
      ),
    });
  }
  if (listingPublicData.perkNameThree && listingPublicData?.perkNameThreePrice) {
    extraParkValues.push({
      key: `${listingPublicData?.perkNameThree}/${perkNameThreePrice}`,
      label: `${listingPublicData?.perkNameThree}/${perkNameThreePrice}`,
      value: convertMoneyToNumber(
        new Money(listingPublicData?.perkNameThreePrice?.amount || 0, 'USD')
      ),
    });
  }

  // const xdxfghk = [
  //   {
  //     key: `${listingPublicData.perkNameOne}/${perkNameOnePrice}`,
  //     label: `${listingPublicData.perkNameOne}/${perkNameOnePrice}`,
  //     value: convertMoneyToNumber(new Money(listingPublicData.perkNameOnePrice.amount || 0, 'USD')),
  //   },
  //   {
  //     key: `${listingPublicData.perkNameTwo}/${perkNameTwoPrice}`,
  //     label: `${listingPublicData.perkNameTwo}/${perkNameTwoPrice}`,
  //     value: convertMoneyToNumber(new Money(listingPublicData.perkNameTwoPrice.amount || 0, 'USD')),
  //   },
  //   {
  //     key: `${listingPublicData.perkNameThree}/${perkNameThreePrice}`,
  //     label: `${listingPublicData.perkNameThree}/${perkNameThreePrice}`,
  //     value: convertMoneyToNumber(
  //       new Money(listingPublicData.perkNameThreePrice.amount || 0, 'USD')
  //     ),
  //   },
  // ];

  const publicData = listing?.attributes?.publicData || {};
  const { unitType, transactionProcessAlias = '' } = publicData || {};
  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const lineItemUnitType = lineItemUnitTypeMaybe || `line-item/${unitType}`;

  const price = listing?.attributes?.price;
  const isPaymentProcess = processName !== INQUIRY_PROCESS_NAME;

  const showPriceMissing = isPaymentProcess && !price;
  const PriceMissing = () => {
    return (
      <p className={css.error}>
        <FormattedMessage id="OrderPanel.listingPriceMissing" />
      </p>
    );
  };
  const showInvalidCurrency = isPaymentProcess && price?.currency !== marketplaceCurrency;
  const InvalidCurrency = () => {
    return (
      <p className={css.error}>
        <FormattedMessage id="OrderPanel.listingCurrencyInvalid" />
      </p>
    );
  };

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const isClosed = listing?.attributes?.state === LISTING_STATE_CLOSED;

  const isBooking = isBookingProcess(processName);
  const shouldHaveBookingTime = isBooking && [LINE_ITEM_HOUR].includes(lineItemUnitType);
  const showBookingTimeForm = shouldHaveBookingTime && !isClosed && timeZone;

  const shouldHaveBookingDates =
    isBooking && [LINE_ITEM_DAY, LINE_ITEM_NIGHT].includes(lineItemUnitType);
  const showBookingDatesForm = shouldHaveBookingDates && !isClosed && timeZone;

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const isPurchase = isPurchaseProcess(processName);
  const currentStock = listing.currentStock?.attributes?.quantity;
  const isOutOfStock = isPurchase && lineItemUnitType === LINE_ITEM_ITEM && currentStock === 0;

  // Show form only when stock is fully loaded. This avoids "Out of stock" UI by
  // default before all data has been downloaded.
  const showProductOrderForm = isPurchase && typeof currentStock === 'number';

  const showInquiryForm = processName === INQUIRY_PROCESS_NAME;

  const supportedProcessesInfo = getSupportedProcessesInfo();
  const isKnownProcess = supportedProcessesInfo.map(info => info.name).includes(processName);

  const { pickupEnabled, shippingEnabled } = listing?.attributes?.publicData || {};

  const showClosedListingHelpText = listing.id && isClosed;
  const { formattedPrice, priceTitle } = priceData(price, marketplaceCurrency, intl);
  const isOrderOpen = !!parse(location.search).orderOpen;

  const subTitleText = showClosedListingHelpText
    ? intl.formatMessage({ id: 'OrderPanel.subTitleClosedListing' })
    : null;

  const authorDisplayName = userDisplayNameAsString(author, '');

  const classes = classNames(rootClassName || css.root, className);
  const titleClasses = classNames(titleClassName || css.orderTitle);

  const isPartner = currentUser?.attributes?.profile?.publicData?.userType === 'partner';

  return (
    <div className={classes}>
      <ModalInMobile
        containerClassName={css.modalContainer}
        id="OrderFormInModal"
        isModalOpenOnMobile={isOrderOpen}
        onClose={() => closeOrderModal(history, location)}
        showAsModalMaxWidth={MODAL_BREAKPOINT}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.bookingMessage}>Book This Remote Work Day Pass</div>
        <div className={css.modalHeading}>
          <H1 className={css.heading}>{title}</H1>
        </div>

        <div className={css.orderHeading}>
          {titleDesktop ? titleDesktop : <H2 className={titleClasses}>{title}</H2>}
          {subTitleText ? <div className={css.orderHelp}>{subTitleText}</div> : null}
        </div>

        <PriceMaybe
          price={price}
          publicData={publicData}
          validListingTypes={validListingTypes}
          intl={intl}
        />

        {/* <div className={css.author}>
          <AvatarSmall user={author} className={css.providerAvatar} />
          <span className={css.providerNameLinked}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorLink }} />
          </span>
          <span className={css.providerNamePlain}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorDisplayName }} />
          </span>
        </div> */}

        {showPriceMissing ? (
          <PriceMissing />
        ) : showInvalidCurrency ? (
          <InvalidCurrency />
        ) : showBookingTimeForm ? (
          <BookingTimeForm
            className={css.bookingForm}
            formId="OrderPanelBookingTimeForm"
            lineItemUnitType={lineItemUnitType}
            onSubmit={onSubmit}
            price={price}
            marketplaceCurrency={marketplaceCurrency}
            dayCountAvailableForBooking={dayCountAvailableForBooking}
            listingId={listing.id}
            isOwnListing={isOwnListing}
            monthlyTimeSlots={monthlyTimeSlots}
            onFetchTimeSlots={onFetchTimeSlots}
            startDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
            endDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
            timeZone={timeZone}
            marketplaceName={marketplaceName}
            onFetchTransactionLineItems={onFetchTransactionLineItems}
            lineItems={lineItems}
            fetchLineItemsInProgress={fetchLineItemsInProgress}
            fetchLineItemsError={fetchLineItemsError}
            listingTimeZone={listingTimeZone}
            currentUser={currentUser}
          />
        ) : showBookingDatesForm ? (
          <BookingDatesForm
            className={css.bookingForm}
            formId="OrderPanelBookingDatesForm"
            lineItemUnitType={lineItemUnitType}
            onSubmit={onSubmit}
            price={price}
            marketplaceCurrency={marketplaceCurrency}
            dayCountAvailableForBooking={dayCountAvailableForBooking}
            listingId={listing.id}
            listing={listing}
            isOwnListing={isOwnListing}
            monthlyTimeSlots={monthlyTimeSlots}
            onFetchTimeSlots={onFetchTimeSlots}
            timeZone={timeZone}
            marketplaceName={marketplaceName}
            onFetchTransactionLineItems={onFetchTransactionLineItems}
            lineItems={lineItems}
            fetchLineItemsInProgress={fetchLineItemsInProgress}
            fetchLineItemsError={fetchLineItemsError}
            extraParkValues={extraParkValues}
            guestMaxForListing={listing?.attributes?.publicData?.guests || 0}
            listingTimeZone={listingTimeZone}
            currentUser={currentUser}
          />
        ) : showProductOrderForm ? (
          <ProductOrderForm
            formId="OrderPanelProductOrderForm"
            onSubmit={onSubmit}
            price={price}
            marketplaceCurrency={marketplaceCurrency}
            currentStock={currentStock}
            pickupEnabled={pickupEnabled}
            shippingEnabled={shippingEnabled}
            listingId={listing.id}
            isOwnListing={isOwnListing}
            marketplaceName={marketplaceName}
            onFetchTransactionLineItems={onFetchTransactionLineItems}
            onContactUser={onContactUser}
            lineItems={lineItems}
            fetchLineItemsInProgress={fetchLineItemsInProgress}
            fetchLineItemsError={fetchLineItemsError}
          />
        ) : showInquiryForm ? (
          <InquiryWithoutPaymentForm formId="OrderPanelInquiryForm" onSubmit={onSubmit} />
        ) : !isKnownProcess ? (
          <p className={css.errorSidebar}>
            <FormattedMessage id="OrderPanel.unknownTransactionProcess" />
          </p>
        ) : null}
      </ModalInMobile>
      <div className={css.openOrderForm}>
        <div className={css.priceContainerInCTA}>
          <div className={css.priceValue} title={priceTitle}>
            {formattedPrice}
          </div>
          <div className={css.perUnitInCTA}>
            <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
          </div>
        </div>

        {isPartner ? (
          <div className={css.infoTxt}>To book a listing please create a customer account!</div>
        ) : isClosed ? (
          <div className={css.closedListingButton}>
            <FormattedMessage id="OrderPanel.closedListingButtonText" />
          </div>
        ) : (
          <PrimaryButton
            onClick={handleSubmit(
              isOwnListing,
              isClosed,
              showInquiryForm,
              onSubmit,
              history,
              location
            )}
            disabled={isOutOfStock || isOwnListing}
          >
            {isBooking ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageBooking" />
            ) : isOutOfStock ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageNoStock" />
            ) : isPurchase ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessagePurchase" />
            ) : (
              <FormattedMessage id="OrderPanel.ctaButtonMessageInquiry" />
            )}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

OrderPanel.defaultProps = {
  rootClassName: null,
  className: null,
  titleClassName: null,
  isOwnListing: false,
  authorLink: null,
  titleDesktop: null,
  subTitle: null,
  monthlyTimeSlots: null,
  lineItems: null,
  fetchLineItemsError: null,
};

OrderPanel.propTypes = {
  rootClassName: string,
  className: string,
  titleClassName: string,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]),
  validListingTypes: arrayOf(
    shape({
      listingType: string.isRequired,
      transactionType: shape({
        process: string.isRequired,
        alias: string.isRequired,
        unitType: string.isRequired,
      }).isRequired,
    })
  ).isRequired,
  isOwnListing: bool,
  author: oneOfType([propTypes.user, propTypes.currentUser]).isRequired,
  authorLink: node,
  onSubmit: func.isRequired,
  title: oneOfType([node, string]).isRequired,
  titleDesktop: node,
  subTitle: oneOfType([node, string]),
  onManageDisableScrolling: func.isRequired,

  onFetchTimeSlots: func.isRequired,
  monthlyTimeSlots: object,
  onFetchTransactionLineItems: func.isRequired,
  onContactUser: func,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,
  marketplaceCurrency: string.isRequired,
  dayCountAvailableForBooking: number.isRequired,
  marketplaceName: string.isRequired,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default compose(withRouter, injectIntl)(OrderPanel);
