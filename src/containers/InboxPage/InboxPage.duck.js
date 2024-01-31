import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { getAllTransitionsForEveryProcess } from '../../transactions/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { apiBaseUrl } from '../../util/api';
import axios from 'axios';
import { types as sdkTypes } from '../../util/sdkLoader';
import moment from 'moment';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';

const { UUID } = sdkTypes;

const sortedTransactions = txs =>
  reverse(
    sortBy(txs, tx => {
      return tx.attributes ? tx.attributes.lastTransitionedAt : null;
    })
  );

// ================ Action types ================ //

export const FETCH_ORDERS_OR_SALES_REQUEST = 'app/InboxPage/FETCH_ORDERS_OR_SALES_REQUEST';
export const FETCH_ORDERS_OR_SALES_SUCCESS = 'app/InboxPage/FETCH_ORDERS_OR_SALES_SUCCESS';
export const FETCH_ORDERS_OR_SALES_ERROR = 'app/InboxPage/FETCH_ORDERS_OR_SALES_ERROR';

export const FETCH_PER_DAY_ORDERS_OR_SALES_REQUEST =
  'app/InboxPage/FETCH_PER_DAY_ORDERS_OR_SALES_REQUEST';
export const FETCH_PER_DAY_ORDERS_OR_SALES_SUCCESS =
  'app/InboxPage/FETCH_PER_DAY_ORDERS_OR_SALES_SUCCESS';
export const FETCH_PER_DAY_ORDERS_OR_SALES_ERROR =
  'app/InboxPage/FETCH_PER_DAY_ORDERS_OR_SALES_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  fetchInProgress: false,
  fetchOrdersOrSalesError: null,
  pagination: null,
  transactionRefs: [],
  perDayTransaction: {},
  perDayTransactionError: null,
  perDayTransactionFetchInProgress: false,
};

export default function inboxPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_ORDERS_OR_SALES_REQUEST:
      return { ...state, fetchInProgress: true, fetchOrdersOrSalesError: null };
    case FETCH_ORDERS_OR_SALES_SUCCESS: {
      const transactions = sortedTransactions(payload.data.data);
      return {
        ...state,
        fetchInProgress: false,
        transactionRefs: entityRefs(transactions),
        pagination: payload.data.meta,
      };
    }
    case FETCH_ORDERS_OR_SALES_ERROR:
      console.error(payload); // eslint-disable-line
      return {
        ...state,
        fetchInProgress: false,
        fetchOrdersOrSalesError: payload,
      };

    case FETCH_PER_DAY_ORDERS_OR_SALES_REQUEST:
      return {
        ...state,
        perDayTransactionFetchInProgress: true,
        perDayTransactionError: null,
      };
    case FETCH_PER_DAY_ORDERS_OR_SALES_SUCCESS:
      return {
        ...state,
        perDayTransactionFetchInProgress: false,
        perDayTransaction: { ...state.perDayTransaction, ...payload },
      };
    case FETCH_PER_DAY_ORDERS_OR_SALES_ERROR:
      return {
        ...state,
        perDayTransactionError: payload,
        perDayTransactionFetchInProgress: false,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

const fetchOrdersOrSalesRequest = () => ({
  type: FETCH_ORDERS_OR_SALES_REQUEST,
});
const fetchOrdersOrSalesSuccess = response => ({
  type: FETCH_ORDERS_OR_SALES_SUCCESS,
  payload: response,
});
const fetchOrdersOrSalesError = e => ({
  type: FETCH_ORDERS_OR_SALES_ERROR,
  error: true,
  payload: e,
});

const fetchPerDayOrdersOrSalesRequest = () => ({
  type: FETCH_PER_DAY_ORDERS_OR_SALES_REQUEST,
});
const fetchPerDayOrdersOrSalesSuccess = response => ({
  type: FETCH_PER_DAY_ORDERS_OR_SALES_SUCCESS,
  payload: response,
});
const fetchPerDayOrdersOrSalesError = e => ({
  type: FETCH_PER_DAY_ORDERS_OR_SALES_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

const INBOX_PAGE_SIZE = 10;

export const searchTransactions = (
  userNameAndConfirmNumber,
  bookingStart,
  bookingEnd,
  type,
  page = 1
) => (dispatch, getState, sdk) => {
  let meta = {};
  const queryArr = [];
  if (!!userNameAndConfirmNumber) {
    queryArr.push(`userNameAndConfirmNumber=${userNameAndConfirmNumber.replace(/\s/g, '')}`);
  }
  if (!!bookingStart) {
    queryArr.push(`bookingStart=${bookingStart}`);
  }
  if (!!bookingEnd) {
    queryArr.push(`bookingEnd=${bookingEnd}`);
  }

  if (queryArr.length <= 0) {
    if (typeof window !== 'undefined') {
      const tab = type === 'customer' ? 'orders' : 'sales';
      window.history.pushState(null, '', `/inbox/${tab}`);
    }
    const params = { tab: type === 'customer' ? 'orders' : 'sales' };
    dispatch(loadData(params));
    return;
  }
  if (!!page && typeof page === 'number') {
    queryArr.push(`page=${page}`);
  }
  dispatch(fetchOrdersOrSalesRequest());
  const query = queryArr.reduce((acc, val, indx) => {
    if (indx > 0) {
      return acc + `&${val}`;
    }
    return acc + val;
  }, '');

  const url = `${apiBaseUrl()}/api/transaction/${type}?${query}`;
  const apiQueryParams = {
    include: [
      'listing',
      'provider',
      'provider.profileImage',
      'customer',
      'customer.profileImage',
      'booking',
    ],
    'fields.transaction': [
      'processName',
      'lastTransition',
      'lastTransitionedAt',
      'transitions',
      'payinTotal',
      'payoutTotal',
      'lineItems',
    ],
    'fields.listing': ['title', 'availabilityPlan', 'publicData.listingType'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'profile'],
    'fields.image': ['variants.square-small', 'variants.square-small2x'],
  };
  return axios
    .get(url, { withCredentials: true })
    .then(resp => {
      meta = resp.data.meta;
      const { data } = resp.data || [];
      return Promise.all(
        data.map(d => sdk.transactions.show({ id: new UUID(d.id), ...apiQueryParams }))
      );
    })
    .then(resp => {
      const formatedData = resp.reduce(
        (acc, r) => {
          const { data, included } = r.data;
          acc.data.data.push(data);
          acc.data.included.push(...included);
          return acc;
        },
        { data: { data: [], included: [], meta } }
      );

      const finalData = {
        status: 200,
        statusText: 'ok',
        ...formatedData,
      };
      dispatch(addMarketplaceEntities(finalData));
      dispatch(fetchOrdersOrSalesSuccess(finalData));
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `?${query}`);
      }
      return finalData;
    })
    .catch(err => {
      dispatch(fetchOrdersOrSalesError(err));
    });
};

export const fetchPerDayTransactions = (bookingStart, bookingEnd, type) => (
  dispatch,
  getState,
  sdk
) => {
  const queryArr = [];
  if (!!bookingStart) {
    queryArr.push(`bookingStart=${bookingStart}`);
  }
  if (!!bookingEnd) {
    queryArr.push(`bookingEnd=${bookingEnd}`);
  }

  if (queryArr.length <= 0) {
    return;
  }
  dispatch(fetchPerDayOrdersOrSalesRequest());
  const query = queryArr.reduce((acc, val, indx) => {
    if (indx > 0) {
      return acc + `&${val}`;
    }
    return acc + val;
  }, '');
  const url = `${apiBaseUrl()}/api/transaction/${type}?${query}`;
  return axios
    .get(url, { withCredentials: true })
    .then(resp => {
      const { data } = resp.data;
      const perDayTransaction = {};
      for (let d of data) {
        // const formatedDate = moment(d.bookingStartDate)
        //   // .tz(d.timeZone)
        //   // .tz(d.timeZone)
        //   .format('YYYY-MM-DD');

        const formatedDate = moment(d.bookingStartDate)
          .toISOString()
          .split('T')[0];

        if (perDayTransaction[formatedDate] === undefined) {
          perDayTransaction[formatedDate] = 0;
        }
        perDayTransaction[formatedDate] += 1;
      }
      dispatch(fetchPerDayOrdersOrSalesSuccess(perDayTransaction));
    })
    .catch(err => {
      dispatch(fetchPerDayOrdersOrSalesError(storableError(err)));
    });
};

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  const { tab } = params;

  const onlyFilterValues = {
    orders: 'order',
    sales: 'sale',
  };

  const onlyFilter = onlyFilterValues[tab];
  if (!onlyFilter) {
    return Promise.reject(new Error(`Invalid tab for InboxPage: ${tab}`));
  }

  dispatch(fetchOrdersOrSalesRequest());

  const { page = 1, userNameAndConfirmNumber, bookingStart } = parse(search);

  const apiQueryParams = {
    only: onlyFilter,
    lastTransitions: getAllTransitionsForEveryProcess(),
    include: [
      'listing',
      'provider',
      'provider.profileImage',
      'customer',
      'customer.profileImage',
      'booking',
    ],
    'fields.transaction': [
      'processName',
      'lastTransition',
      'lastTransitionedAt',
      'transitions',
      'payinTotal',
      'payoutTotal',
      'lineItems',
      'protectedData.confirmationNumber',
    ],
    'fields.listing': ['title', 'availabilityPlan', 'publicData.listingType'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'profile'],
    'fields.image': ['variants.square-small', 'variants.square-small2x'],
    page,
    perPage: INBOX_PAGE_SIZE,
  };

  const momentStartDay = bookingStart ? moment(bookingStart) : moment();
  const momentEndDay = bookingStart ? moment(bookingStart) : moment();
  const startDay = momentStartDay.startOf('month').toISOString();
  const endDay = momentEndDay.endOf('month').toISOString();

  const type = tab === 'orders' ? 'customer' : 'provider';
  let transactionLoadPromise = Promise.resolve();
  if (!!userNameAndConfirmNumber || !!bookingStart) {
    transactionLoadPromise = dispatch(
      searchTransactions(userNameAndConfirmNumber, bookingStart, undefined, type, page)
    );
  } else {
    transactionLoadPromise = sdk.transactions
      .query(apiQueryParams)
      .then(response => {
        dispatch(addMarketplaceEntities(response));
        dispatch(fetchOrdersOrSalesSuccess(response));
        return response;
      })
      .catch(e => {
        dispatch(fetchOrdersOrSalesError(storableError(e)));
        throw e;
      });
  }

  return Promise.all([
    transactionLoadPromise,
    dispatch(fetchPerDayTransactions(startDay, endDay, type)),
  ]);
};
