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
import { subtractTime, getStartOf, addTime, getDefaultTimeZoneOnBrowser } from '../../util/dates';
import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  resolveLatestProcessName,
  getProcess,
  isBookingProcess,
} from '../../transactions/transaction';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
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
  Modal,
} from '../../components';
import { required, bookingDatesRequired, composeValidators } from '../../util/validators';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import { stateDataShape, getStateData } from './InboxPage.stateData';
import css from './InboxPage.module.css';
import { fetchPerDayTransactions, searchTransactions } from './InboxPage.duck';
import { useCallback } from 'react';
import moment from 'moment';
import { isEmpty } from 'lodash';
import { withRouter } from 'react-router-dom/cjs/react-router-dom.min';
import { parse } from 'query-string';

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
  const { showFrom, intl, handleOnChange, onChangeKey, className, value } = props;
  const [searchText, setSearchText] = useState(value || '');

  const debounceCallback = func => {
    let timeoutId = null;
    return function delayedCallback(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        clearTimeout(timeoutId);
      }, 500);
    };
  };

  const debounceHandleOnChange = useCallback(debounceCallback(handleOnChange), []);

  const onChangeText = e => {
    const value = e.target.value;
    setSearchText(value);
    debounceHandleOnChange(onChangeKey, value);
  };
  const handleSubmit = e => {
    e.preventDefault();
  };

  return showFrom ? (
    <div className={classNames(css.formWrapper, className)}>
      <form onSubmit={handleSubmit}>
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
    perDayTransaction,
    perDayTransactionError,
    perDayTransactionFetchInProgress,
    onfetchPerDayTransactions,
    location,
    onManageDisableScrolling,
    ...rest
  } = props;
  const searchParams = parse(location?.search || '');

  const [transactionSearchDetails, setTransactionSearchDetails] = useState({
    userNameAndConfirmNumber: searchParams?.userNameAndConfirmNumber || '',
    bookingStart: searchParams?.bookingStart || '',
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
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
    if (!isFirstLoad) {
      onSearchTransactions(
        transactionSearchDetails.userNameAndConfirmNumber,
        transactionSearchDetails.bookingStart,
        undefined,
        type
      );
    }
  }, [transactionSearchDetails.userNameAndConfirmNumber, transactionSearchDetails.bookingStart]);

  useEffect(() => {
    setIsFirstLoad(false);
  }, []);

  useEffect(() => {
    if (location) {
      const searchParams = parse(location?.search || '');
      setTransactionSearchDetails({
        userNameAndConfirmNumber: searchParams?.userNameAndConfirmNumber || '',
        bookingStart: searchParams?.bookingStart || '',
      });
    }
  }, [location]);
  if (!validTab) {
    return <NotFoundPage />;
  }

  const isOrders = tab === 'orders';
  const hasNoResults = !fetchInProgress && transactions.length === 0 && !fetchOrdersOrSalesError;
  const ordersTitle = intl.formatMessage({ id: 'InboxPage.ordersTitle' });
  const salesTitle = intl.formatMessage({ id: 'InboxPage.salesTitle' });
  const title = isOrders ? ordersTitle : salesTitle;
  const searchParamsMaybe =
    transactionSearchDetails.userNameAndConfirmNumber && transactionSearchDetails.bookingStart
      ? {
          userNameAndConfirmNumber: transactionSearchDetails.userNameAndConfirmNumber,
          bookingStart: transactionSearchDetails.booking,
        }
      : transactionSearchDetails.userNameAndConfirmNumber
      ? {
          userNameAndConfirmNumber: transactionSearchDetails.userNameAndConfirmNumber,
        }
      : transactionSearchDetails.bookingStart
      ? { bookingStart: transactionSearchDetails.bookingStart }
      : {};

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
  const [modalOpen, SetModalOpen] = useState(false);

  const handleSubmit = values => {};

  const loadTransactionOnMonthChange = day => {
    const momentStartDay = moment(day);
    const momentEndDay = moment(day);
    const startDay = momentStartDay.startOf('month').toISOString();
    const endDay = momentEndDay.endOf('month').toISOString();
    const type = tab === 'orders' ? 'customer' : 'provider';
    onfetchPerDayTransactions(startDay, endDay, type);
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled} className={css.InboxPageWrap}>
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
                initialValues={{
                  startDate: {
                    date: moment(transactionSearchDetails.bookingStart)
                      .tz(getDefaultTimeZoneOnBrowser())
                      .toDate(),
                  },
                }}
                handleDateOnChange={value =>
                  setTransactionSearchDetails(details => ({
                    ...details,
                    bookingStart: value,
                  }))
                }
                intl={intl}
                onSubmit={handleSubmit}
                isDateLoading={perDayTransactionFetchInProgress && isEmpty(perDayTransaction)}
                perDayTransaction={perDayTransaction}
                render={fieldRenderProps => {
                  const {
                    handleSubmit,
                    values,
                    handleDateOnChange,
                    isDateLoading,
                    perDayTransaction,
                  } = fieldRenderProps;

                  const classes = classNames(rootClassName || css.root, className);

                  return (
                    <Form
                      onSubmit={handleSubmit}
                      className={classNames(classes, css.FormWrap)}
                      enforcePagePreloadFor="InboxPage"
                    >
                      <div className={css.DateMobWrap}>
                        <button
                          className={css.ChooseDateBtn}
                          onClick={() => SetModalOpen(!modalOpen)}
                        >
                          Choose Date
                          <svg
                          className={classes}
                          width="8"
                          height="5"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 10-.471-.471L4 3.528l-2.43-2.43a.333.333 0 10-.471.471l2.665 2.667z"
                            fill="#4A4A4A"
                            stroke="#4A4A4A"
                            fillRule="evenodd"
                          />
                        </svg>
                        </button>

                        {modalOpen && (
                          <div className={css.mobDateCalender}>
                            {isDateLoading ? (
                              <div className={css.dateLoader}>
                                <IconSpinner className={css.icon} />
                              </div>
                            ) : (
                              <FieldDateInput
                                dateClassName={css.inboxPageCalender}
                                id="startDate"
                                name="startDate"
                                placeholderText={`Date`}
                                isDayBlocked={day => {
                                  const formatedDate = moment(day).format('YYYY-MM-DD');
                                  const hasTransactionThatDay = !!perDayTransaction[formatedDate];

                                  return hasTransactionThatDay
                                    ? moment().diff(day, 'day') > 0
                                    : false;
                                }}
                                onChange={value => {
                                  console.log(value.date);
                                  handleDateOnChange(moment(value.date).format('YYYY-MM-DD'));
                                  SetModalOpen(false);
                                }}
                                keepOpenCalender={true}
                                keepOpenOnDateSelect={true}
                                firstDayOfWeek={0}
                                weekDayFormat="ddd"
                                onNextMonthClick={loadTransactionOnMonthChange}
                                onPrevMonthClick={loadTransactionOnMonthChange}
                                isDayHighlighted={day => {
                                  const formatedDate = moment(day).format('YYYY-MM-DD');
                                  return !!perDayTransaction[formatedDate];
                                }}
                                useMobileMargins
                                enableOutsideDays={false}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className={css.DateFormWrap}>
                        {/* {isDateLoading ? (
                          <div className={css.dateLoader}>
                            <IconSpinner className={css.icon} />
                          </div>
                        ) : ( */}
                        <FieldDateInput
                          dateClassName={css.inboxPageCalender}
                          id="startDate"
                          name="startDate"
                          placeholderText={`Date`}
                          isDayBlocked={day => {
                            const formatedDate = moment(day).format('YYYY-MM-DD');
                            const hasTransactionThatDay = !!perDayTransaction[formatedDate];

                            return hasTransactionThatDay ? moment().diff(day, 'day') > 0 : false;
                          }}
                          onChange={value => {
                            console.log(value.date);
                            handleDateOnChange(moment(value.date).format('YYYY-MM-DD'));
                          }}
                          keepOpenCalender={true}
                          keepOpenOnDateSelect={true}
                          firstDayOfWeek={0}
                          weekDayFormat="ddd"
                          onNextMonthClick={loadTransactionOnMonthChange}
                          onPrevMonthClick={loadTransactionOnMonthChange}
                          isDayHighlighted={day => {
                            const formatedDate = moment(day).format('YYYY-MM-DD');
                            return !!perDayTransaction[formatedDate];
                          }}
                          useMobileMargins
                          enableOutsideDays={false}
                        />
                        {/* )} */}
                      </div>
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
        <H2 as="h1" className={classNames(css.title, css.titleMob)}>
          <FormattedMessage id="InboxPage.title" />
        </H2>

        <SearchForm
          className={css.searchForm}
          showFrom={!isOrders}
          intl={intl}
          handleOnChange={searchTransactionBy}
          onChangeKey={'userNameAndConfirmNumber'}
          value={transactionSearchDetails.userNameAndConfirmNumber}
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
            pageSearchParams={searchParamsMaybe}
          />
        ) : null}
      </LayoutSideNavigation>
      {/* <Modal
        id="DateModal"
         
        isOpen={!!modalOpen}
        onClose={() => {
          SetModalOpen(false);
        }}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
       
      >
        {currentUser && currentUser?.attributes?.profile?.publicData?.userType === 'partner' && (
          <FinalForm
            {...rest}
            initialValues={{
              startDate: {
                date: moment(transactionSearchDetails.bookingStart)
                  .tz(getDefaultTimeZoneOnBrowser())
                  .toDate(),
              },
            }}
            handleDateOnChange={value =>
              setTransactionSearchDetails(details => ({
                ...details,
                bookingStart: value,
              }))
            }
            intl={intl}
            onSubmit={handleSubmit}
            isDateLoading={perDayTransactionFetchInProgress && isEmpty(perDayTransaction)}
            perDayTransaction={perDayTransaction}
            render={fieldRenderProps => {
              const {
                handleSubmit,
                values,
                handleDateOnChange,
                isDateLoading,
                perDayTransaction,
              } = fieldRenderProps;

              const classes = classNames(rootClassName || css.root, className);

              return (
                <Form
                  onSubmit={handleSubmit}
                
                  enforcePagePreloadFor="InboxPage"
                >
                  <div className={css.mobDateCalender}>
                    
                    <FieldDateInput
                      dateClassName={css.inboxPageCalender}
                      id="startDateInModal"
                      name="startDate"
                      placeholderText={`Date`}
                      isDayBlocked={day => {
                        const formatedDate = moment(day).format('YYYY-MM-DD');
                        const hasTransactionThatDay = !!perDayTransaction[formatedDate];

                        return hasTransactionThatDay ? moment().diff(day, 'day') > 0 : false;
                      }}
                      onChange={value => { 
                       
                        handleDateOnChange(moment(value.date).format('YYYY-MM-DD'));
                        SetModalOpen(false);
                      }}
                      keepOpenCalender={true}
                      keepOpenOnDateSelect={true}
                      firstDayOfWeek={0}
                      weekDayFormat="ddd"
                      onNextMonthClick={loadTransactionOnMonthChange}
                      onPrevMonthClick={loadTransactionOnMonthChange}
                      isDayHighlighted={day => {
                        const formatedDate = moment(day).format('YYYY-MM-DD');
                        return !!perDayTransaction[formatedDate];
                      }}
                      useMobileMargins
                      enableOutsideDays={false}
                    />
                    {/* )} */}
      {/* </div>
                </Form>
              );
            }}
          />
        )}
      </Modal> */}
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
  const {
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    transactionRefs,
    perDayTransaction,
    perDayTransactionError,
    perDayTransactionFetchInProgress,
  } = state.InboxPage;
  const { currentUser, currentUserNotificationCount: providerNotificationCount } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
    perDayTransaction,
    perDayTransactionError,
    perDayTransactionFetchInProgress,
  };
};
const mapDispatchToProps = dispatch => ({
  onSearchTransactions: (userNameAndConfirmNumber, bookingStart, bookingEnd, type) =>
    dispatch(searchTransactions(userNameAndConfirmNumber, bookingStart, bookingEnd, type)),
  onfetchPerDayTransactions: (bookingStart, bookingEnd, type) =>
    dispatch(fetchPerDayTransactions(bookingStart, bookingEnd, type)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  // getConfirmationNumber:()
});

const InboxPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
