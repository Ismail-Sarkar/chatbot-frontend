import React, { useEffect, useState } from 'react';
import { arrayOf, bool, number, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import {
  propTypes,
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  LINE_ITEM_NIGHT,
  LINE_ITEM_HOUR,
  LISTING_UNIT_TYPES,
} from '../../util/types';
import { subtractTime, getStartOf, addTime } from '../../util/dates';
import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  resolveLatestProcessName,
  getProcess,
  isBookingProcess,
} from '../../transactions/transaction';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import {
  Form,
  H2,
  Avatar,
  NamedLink,
  NotificationBadge,
  Page,
  PaginationLinks,
  TabNav,
  IconSpinner,
  TimeRange,
  UserDisplayName,
  LayoutSideNavigation,
  FieldDateRangeInput,
  FieldDateInput,
} from '../../components';
import { required, bookingDatesRequired, composeValidators } from '../../util/validators';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import { stateDataShape, getStateData } from './InboxPage.stateData';
import css from './InboxPage.module.css';
import { searchTransactions } from './InboxPage.duck';
import { useCallback } from 'react';
import moment from 'moment';

// Check if the transaction line-items use booking-related units
const getUnitLineItem = lineItems => {
  const unitLineItem = lineItems?.find(
    item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
  );
  return unitLineItem;
};

// Booking data (start & end) are bit different depending on display times and
// if "end" refers to last day booked or the first exclusive day
const bookingData = (tx, lineItemUnitType, timeZone) => {
  // Attributes: displayStart and displayEnd can be used to differentiate shown time range
  // from actual start and end times used for availability reservation. It can help in situations
  // where there are preparation time needed between bookings.
  // Read more: https://www.sharetribe.com/api-reference/marketplace.html#bookings
  const { start, end, displayStart, displayEnd } = tx.booking.attributes;
  const bookingStart = displayStart || start;
  const bookingEndRaw = displayEnd || end;

  // When unit type is night, we can assume booking end to be inclusive.
  const isNight = lineItemUnitType === LINE_ITEM_NIGHT;
  const isHour = lineItemUnitType === LINE_ITEM_HOUR;
  const bookingEnd =
    isNight || isHour ? bookingEndRaw : subtractTime(bookingEndRaw, 1, 'days', timeZone);

  return { bookingStart, bookingEnd };
};

const BookingTimeInfoMaybe = props => {
  const { transaction, ...rest } = props;

  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  const process = getProcess(processName);
  const isInquiry = process.getState(transaction) === process.states.INQUIRY;

  if (isInquiry) {
    return null;
  }

  const hasLineItems = transaction?.attributes?.lineItems?.length > 0;
  const unitLineItem = hasLineItems
    ? transaction.attributes?.lineItems?.find(
        item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
      )
    : null;

  const lineItemUnitType = unitLineItem ? unitLineItem.code : null;
  const dateType = lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;

  const timeZone = transaction?.listing?.attributes?.availabilityPlan?.timezone || 'Etc/UTC';
  const { bookingStart, bookingEnd } = bookingData(transaction, lineItemUnitType, timeZone);

  return (
    <TimeRange
      startDate={bookingStart}
      endDate={bookingEnd}
      dateType={dateType}
      timeZone={timeZone}
      {...rest}
    />
  );
};

BookingTimeInfoMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
};

export const InboxItem = props => {
  const { transactionRole, tx, intl, stateData, isBooking, stockType = 'multipleItems' } = props;

  const { customer, provider, listing } = tx;
  const {
    processName,
    processState,
    actionNeeded,
    isSaleNotification,
    isFinal,
    isAccepted,
  } = stateData;
  const isCustomer = transactionRole === TX_TRANSITION_ACTOR_CUSTOMER;

  const lineItems = tx.attributes?.lineItems;
  const confirmationNumber = tx?.attributes?.protectedData?.confirmationNumber;
  const hasPricingData = lineItems.length > 0;
  const unitLineItem = getUnitLineItem(lineItems);
  const quantity = hasPricingData && !isBooking ? unitLineItem.quantity.toString() : null;
  const showStock = stockType === 'multipleItems' || (quantity && unitLineItem.quantity > 1);

  const otherUser = isCustomer ? provider : customer;
  const otherUserPartner =
    otherUser?.attributes?.profile?.publicData?.userType === 'partner' ? true : false;
  const otherUserDisplayName = <UserDisplayName user={otherUser} intl={intl} />;
  const isOtherUserBanned = otherUser.attributes.banned;

  const rowNotificationDot = isSaleNotification ? <div className={css.notificationDot} /> : null;

  const linkClasses = classNames(css.itemLink, {
    [css.bannedUserLink]: isOtherUserBanned,
  });
  const stateClasses = classNames(css.stateName, {
    [css.stateConcluded]: isFinal,
    [css.stateActionNeeded]: actionNeeded,
    [css.stateNoActionNeeded]: !actionNeeded,
    [css.accepted]: isAccepted,
  });

  return (
    <div className={css.item}>
      <div className={css.itemAvatar}>
        <Avatar user={otherUser} disableProfileLink={!otherUserPartner && true} />
      </div>
      <NamedLink
        className={linkClasses}
        name={isCustomer ? 'OrderDetailsPage' : 'SaleDetailsPage'}
        params={{ id: tx.id.uuid }}
      >
        <div className={css.rowNotificationDot}>{rowNotificationDot}</div>
        <div className={css.nameAndNumber}>
          <div className={css.itemUsername}>{otherUserDisplayName}</div>
          <div>
            {tx?.attributes?.protectedData?.confirmationNumber &&
              `Confirmation #${confirmationNumber}`}
          </div>
        </div>
        <div className={css.itemTitle}>{listing?.attributes?.title}</div>
        <div className={css.itemDetails}>
          {isBooking ? (
            <BookingTimeInfoMaybe transaction={tx} />
          ) : hasPricingData && showStock ? (
            <FormattedMessage id="InboxPage.quantity" values={{ quantity }} />
          ) : null}
        </div>
        <div className={css.itemState}>
          <div className={stateClasses}>
            <FormattedMessage
              id={`InboxPage.${processName}.${processState}.status`}
              values={{ transactionRole }}
            />
          </div>
        </div>
      </NamedLink>
    </div>
  );
};

InboxItem.propTypes = {
  transactionRole: oneOf([TX_TRANSITION_ACTOR_CUSTOMER, TX_TRANSITION_ACTOR_PROVIDER]).isRequired,
  tx: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
  stateData: stateDataShape.isRequired,
};

const SearchForm = props => {
  const { showFrom, intl, handleOnChange, onChangeKey } = props;
  const [searchText, setSearchText] = useState('');

  const debounceCallback = func => {
    let timeoutId = null;
    return function delayedCallback(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        clearTimeout(timeoutId);
      }, 1000);
    };
  };

  const debounceHandleOnChange = useCallback(debounceCallback(handleOnChange), []);

  const onChangeText = e => {
    const value = e.target.value;
    setSearchText(value);
    debounceHandleOnChange(onChangeKey, value);
  };

  return showFrom ? (
    <div className={css.formWrapper}>
      <form>
        <input
          type="text"
          value={searchText}
          onChange={onChangeText}
          id="seachtext"
          placeholder={intl.formatMessage({ id: 'InboxPage.seachPlaceholder' })}
        />
      </form>
    </div>
  ) : null;
};

export const InboxPageComponent = props => {
  const [focusedInput, setFocusedInput] = useState(null);

  const config = useConfiguration();
  const {
    rootClassName,
    className,
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    intl,
    pagination,
    params,
    providerNotificationCount,
    scrollingDisabled,
    transactions,
    onSearchTransactions,
    ...rest
  } = props;
  const [transactionSearchDetails, setTransactionSearchDetails] = useState({
    userNameAndConfirmNumber: '',
    bookingStart: '',
  });
  const { tab } = params;
  const validTab = tab === 'orders' || tab === 'sales';
  const searchTransactionBy = (keyName, value) => {
    setTransactionSearchDetails(transactionDetails => ({
      ...transactionDetails,
      [keyName]: value,
    }));
  };
  useEffect(() => {
    const type = tab === 'orders' ? 'customer' : 'provider';
    onSearchTransactions(
      transactionSearchDetails.userNameAndConfirmNumber,
      transactionSearchDetails.bookingStart,
      type
    );
  }, [transactionSearchDetails.userNameAndConfirmNumber, transactionSearchDetails.bookingStart]);
  if (!validTab) {
    return <NotFoundPage />;
  }

  const isOrders = tab === 'orders';
  const hasNoResults = !fetchInProgress && transactions.length === 0 && !fetchOrdersOrSalesError;
  const ordersTitle = intl.formatMessage({ id: 'InboxPage.ordersTitle' });
  const salesTitle = intl.formatMessage({ id: 'InboxPage.salesTitle' });
  const title = isOrders ? ordersTitle : salesTitle;

  const pickType = lt => conf => conf.listingType === lt;
  const findListingTypeConfig = publicData => {
    const listingTypeConfigs = config.listing?.listingTypes;
    const { listingType } = publicData || {};
    const foundConfig = listingTypeConfigs?.find(pickType(listingType));
    return foundConfig;
  };
  const toTxItem = tx => {
    const transactionRole = isOrders ? TX_TRANSITION_ACTOR_CUSTOMER : TX_TRANSITION_ACTOR_PROVIDER;
    let stateData = null;
    try {
      stateData = getStateData({ transaction: tx, transactionRole, intl });
    } catch (error) {
      // If stateData is missing, omit the transaction from InboxItem list.
    }

    const publicData = tx?.listing?.attributes?.publicData || {};
    const foundListingTypeConfig = findListingTypeConfig(publicData);
    const { transactionType, stockType } = foundListingTypeConfig || {};
    const process = tx?.attributes?.processName || transactionType?.transactionType;
    const transactionProcess = resolveLatestProcessName(process);
    const isBooking = isBookingProcess(transactionProcess);

    // Render InboxItem only if the latest transition of the transaction is handled in the `txState` function.
    return stateData ? (
      <li key={tx.id.uuid} className={css.listItem}>
        <InboxItem
          transactionRole={transactionRole}
          tx={tx}
          intl={intl}
          stateData={stateData}
          stockType={stockType}
          isBooking={isBooking}
        />
      </li>
    ) : null;
  };

  const hasOrderOrSaleTransactions = (tx, isOrdersTab, user) => {
    return isOrdersTab
      ? user?.id && tx && tx.length > 0 && tx[0].customer.id.uuid === user?.id?.uuid
      : user?.id && tx && tx.length > 0 && tx[0].provider.id.uuid === user?.id?.uuid;
  };
  const hasTransactions =
    !fetchInProgress && hasOrderOrSaleTransactions(transactions, isOrders, currentUser);

  const tabs =
    currentUser?.attributes?.profile?.publicData?.userType === 'partner'
      ? [
          {
            text: (
              <span>
                <FormattedMessage id="InboxPage.salesTabTitle" />
                {providerNotificationCount > 0 ? (
                  <NotificationBadge count={providerNotificationCount} />
                ) : null}
              </span>
            ),
            selected: !isOrders,
            linkProps: {
              name: 'InboxPage',
              params: { tab: 'sales' },
            },
          },
        ]
      : [
          {
            text: (
              <span>
                <FormattedMessage id="InboxPage.ordersTabTitle" />
              </span>
            ),
            selected: isOrders,
            linkProps: {
              name: 'InboxPage',
              params: { tab: 'orders' },
            },
          },
        ];
  const handleSubmit = values => {
    console.log(values);
  };
  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        sideNavClassName={css.navigation}
        topbar={
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            currentPage="InboxPage"
          />
        }
        sideNav={
          <>
            <H2 as="h1" className={css.title}>
              <FormattedMessage id="InboxPage.title" />
            </H2>
            <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} />
            {currentUser && currentUser?.attributes?.profile?.publicData?.userType === 'partner' && (
              <FinalForm
                {...rest}
                // unitPrice={unitPrice}
                intl={intl}
                onSubmit={handleSubmit}
                render={fieldRenderProps => {
                  const {
                    endDatePlaceholder,
                    startDatePlaceholder,
                    formId,
                    handleSubmit,

                    submitButtonWrapperClassName,
                    unitType,
                    values,
                    timeSlots,
                    fetchTimeSlotsError,
                    lineItems,
                    fetchLineItemsInProgress,
                    fetchLineItemsError,
                  } = fieldRenderProps;
                  const handleFocusedInputChange = setFocusedInput => focusedInput => {
                    setFocusedInput(focusedInput);
                  };
                  const classes = classNames(rootClassName || css.root, className);
                  const onFocusedInputChange = handleFocusedInputChange(setFocusedInput);

                  const { startDate, endDate } =
                    values && values.bookingDates ? values.bookingDates : {};

                  const bookingStartLabel = intl.formatMessage({
                    id: 'BookingDatesForm.bookingStartTitle',
                  });
                  const bookingEndLabel = intl.formatMessage({
                    id: 'BookingDatesForm.bookingEndTitle',
                  });
                  const requiredMessage = intl.formatMessage({
                    id: 'BookingDatesForm.requiredDate',
                  });
                  const startDateErrorMessage = intl.formatMessage({
                    id: 'FieldDateRangeInput.invalidStartDate',
                  });
                  const endDateErrorMessage = intl.formatMessage({
                    id: 'FieldDateRangeInput.invalidEndDate',
                  });
                  const timeSlotsError = fetchTimeSlotsError ? (
                    <p className={css.sideBarError}>
                      <FormattedMessage id="BookingDatesForm.timeSlotsError" />
                    </p>
                  ) : null;

                  // This is the place to collect breakdown estimation data.
                  // Note: lineItems are calculated and fetched from FTW backend
                  // so we need to pass only booking data that is needed otherwise
                  // If you have added new fields to the form that will affect to pricing,
                  // you need to add the values to handleOnChange function
                  const breakdownData =
                    startDate && endDate
                      ? {
                          startDate,
                          endDate,
                        }
                      : null;

                  const showEstimatedBreakdown =
                    breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

                  const bookingInfoMaybe = showEstimatedBreakdown ? (
                    <div className={css.priceBreakdownContainer}>
                      <h3 className={css.priceBreakdownTitle}>
                        <FormattedMessage id="BookingDatesForm.priceBreakdownTitle" />
                      </h3>
                      <EstimatedCustomerBreakdownMaybe
                        unitType={unitType}
                        breakdownData={breakdownData}
                        lineItems={lineItems}
                      />
                    </div>
                  ) : null;

                  const loadingSpinnerMaybe = fetchLineItemsInProgress ? (
                    <IconSpinner className={css.spinner} />
                  ) : null;

                  const bookingInfoErrorMaybe = fetchLineItemsError ? (
                    <span className={css.sideBarError}>
                      <FormattedMessage id="BookingDatesForm.fetchLineItemsError" />
                    </span>
                  ) : null;

                  const dateFormatOptions = {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  };

                  const now = new Date();
                  const today = getStartOf(now);
                  const tomorrow = addTime(today, 1, 'days');
                  const startDatePlaceholderText =
                    startDatePlaceholder || intl.formatDate(today, dateFormatOptions);
                  const endDatePlaceholderText =
                    endDatePlaceholder || intl.formatDate(tomorrow, dateFormatOptions);
                  const submitButtonClasses = classNames(
                    submitButtonWrapperClassName || css.submitButtonWrapper
                  );
                  const handleOnChange = formValues => {
                    console.log(formValues);
                  };

                  return (
                    <Form
                      onSubmit={handleSubmit}
                      className={classes}
                      enforcePagePreloadFor="CheckoutPage"
                    >
                      {timeSlotsError}
                      <FormSpy
                        subscription={{ values: true }}
                        onChange={values => {
                          handleOnChange(values);
                        }}
                      />
                      <FieldDateInput
                        // className={`${css.street} ${css.expdate}`}
                        id="startDate"
                        name="startDate"
                        placeholderText={`Date`}
                        isDayBlocked={day => {
                          return moment().isSame(day) || moment(values?.startDate).isAfter(day);
                        }}
                        onChange={value => {
                          console.log(value);
                        }}
                        useMobileMargins
                      />
                    </Form>
                  );
                }}
              />
            )}
          </>
        }
        footer={<FooterContainer />}
      >
        {fetchOrdersOrSalesError ? (
          <p className={css.error}>
            <FormattedMessage id="InboxPage.fetchFailed" />
          </p>
        ) : null}
        <SearchForm
          showFrom={!isOrders}
          intl={intl}
          handleOnChange={searchTransactionBy}
          onChangeKey={'userNameAndConfirmNumber'}
        />
        <ul className={css.itemList}>
          {!fetchInProgress ? (
            transactions.map(toTxItem)
          ) : (
            <li className={css.listItemsLoading}>
              <IconSpinner />
            </li>
          )}
          {hasNoResults ? (
            <li key="noResults" className={css.noResults}>
              <FormattedMessage
                id={isOrders ? 'InboxPage.noOrdersFound' : 'InboxPage.noSalesFound'}
              />
            </li>
          ) : null}
        </ul>
        {hasTransactions && pagination && pagination.totalPages > 1 ? (
          <PaginationLinks
            className={css.pagination}
            pageName="InboxPage"
            pagePathParams={params}
            pagination={pagination}
          />
        ) : null}
      </LayoutSideNavigation>
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  currentUser: null,
  currentUserHasOrders: null,
  fetchOrdersOrSalesError: null,
  pagination: null,
  providerNotificationCount: 0,
  sendVerificationEmailError: null,
};

InboxPageComponent.propTypes = {
  params: shape({
    tab: string.isRequired,
  }).isRequired,

  currentUser: propTypes.currentUser,
  fetchInProgress: bool.isRequired,
  fetchOrdersOrSalesError: propTypes.error,
  pagination: propTypes.pagination,
  providerNotificationCount: number,
  scrollingDisabled: bool.isRequired,
  transactions: arrayOf(propTypes.transaction).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { fetchInProgress, fetchOrdersOrSalesError, pagination, transactionRefs } = state.InboxPage;
  const { currentUser, currentUserNotificationCount: providerNotificationCount } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
  };
};
const mapDispatchToProps = dispatch => ({
  onSearchTransactions: (userNameAndConfirmNumber, bookingStart, type) =>
    dispatch(searchTransactions(userNameAndConfirmNumber, bookingStart, type)),
  // getConfirmationNumber:()
});

const InboxPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
