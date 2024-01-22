const { calculateTotalForCustomer } = require('../api-util/lineItemHelpers');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
  getIntegrationSdk,
} = require('../api-util/sdk');
const moment = require('moment');
const marketplaceCurrency = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;

const { createCustomPaymentIntent } = require('../api-util/stripeHelper');
const { addTransactionDetails } = require('../api-util/transactionHelper');
const integrationSdk = getIntegrationSdk();
module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  let lineItems = null;
  let stripePaymentIntents = {},
    transactionResp,
    customer,
    provider,
    timeZone,
    bookingStart;
  // let bookingStart = moment(bodyParams.params.bookingStart)
  //   .add(offset, 'minutes')
  //   .toISOString();

  const paymentMethod = bodyParams?.params?.paymentMethod;

  const currentUserPromise = () => sdk.currentUser.show();

  const listingPromise = () =>
    integrationSdk.listings.show({
      id: bodyParams?.params?.listingId.uuid,
      include: ['author'],
    });

  Promise.all([listingPromise(), fetchCommission(sdk), currentUserPromise()])
    .then(async ([showListingResponse, fetchAssetsResponse, currentUserResponse]) => {
      const listing = showListingResponse.data.data;
      timeZone = listing.attributes?.availabilityPlan.timezone;
      const commissionAsset = fetchAssetsResponse.data.data[0];
      provider = showListingResponse.data.included[0];
      customer = currentUserResponse.data.data;
      const providerId = provider.id.uuid;
      const customerId = customer.id.uuid;
      const offset = moment.tz.zone(timeZone).offset();
      bookingStart = moment(bodyParams.params.bookingStart)
        .subtract(offset, 'minutes')
        .toISOString();
      console.log(bookingStart, offset, timeZone, bodyParams.params.bookingStart);
      const providerCommission =
        commissionAsset?.type === 'jsonAsset'
          ? commissionAsset.attributes.data.providerCommission
          : null;
      lineItems = transactionLineItems(
        listing,
        { ...orderData, ...bodyParams.params },
        providerCommission
      );

      const { amount } = calculateTotalForCustomer(lineItems);

      const paymentIntent = await createCustomPaymentIntent({
        paymentMethodId: paymentMethod,
        listingId: listing.id.uuid,
        providerId,
        customerId,
        currency: marketplaceCurrency,
        description: listing.attributes.title,
        amount,
      });
      const { id, client_secret } = paymentIntent;
      stripePaymentIntents = {
        stripePaymentIntents: {
          default: {
            stripePaymentIntentId: id,
            stripePaymentIntentClientSecret: client_secret,
          },
        },
      };

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      const { params } = bodyParams;

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
          lineItems,
          protectedData: {
            ...stripePaymentIntents,
          },
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.initiateSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.initiate(body, queryParams);
    })
    .then(apiResponse => {
      transactionResp = apiResponse;
      if (isSpeculative) {
        return Promise.resolve();
      } else {
        return addTransactionDetails(
          customer,
          provider,
          transactionResp.data.data,
          bookingStart,
          timeZone
        );
      }
    })
    .then(() => {
      const { status, statusText, data } = transactionResp;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
