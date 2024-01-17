import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { getAllTransitionsForEveryProcess } from '../../transactions/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { apiBaseUrl } from '../../util/api';
import axios from 'axios';
import { types as sdkTypes } from '../../util/sdkLoader';

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

// ================ Thunks ================ //

const INBOX_PAGE_SIZE = 10;

export const searchTransactions = (userNameAndConfirmNumber, bookingStart, type) => (
  dispatch,
  getState,
  sdk
) => {
  const queryArr = [];
  if (!!userNameAndConfirmNumber) {
    queryArr.push(`userNameAndConfirmNumber=${userNameAndConfirmNumber}`);
  }
  if (!!bookingStart) {
    queryArr.push(`bookingStart=${bookingStart}`);
  }
  if (queryArr.length <= 0) return;
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
  axios
    .get(url)
    .then(resp => {
      const data = resp.data || [];
      return Promise.all(
        data.map(d => sdk.transactions.show({ id: new UUID(d.id), ...apiQueryParams }))
      );
    })
    .then(resp => {
      const meta = {
        totalItems: resp.length,
        totalPages: 1,
        page: 1,
        perPage: resp.length,
      };
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
      return finalData;
    })
    .catch(err => {
      dispatch(fetchOrdersOrSalesError(err));
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

  const { page = 1 } = parse(search);

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

  return sdk.transactions
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
};
