const { calculateTotalForCustomer } = require('../api-util/lineItemHelpers');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');
const marketplaceCurrency = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;

const { createCustomPaymentIntent } = require('../api-util/stripeHelper');

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  let lineItems = null;
  let stripePaymentIntents = {};
  const paymentMethod = bodyParams?.params?.paymentMethod;

  const currentUserPromise = () => sdk.currentUser.show({ 'fields.currentUser': [] });

  const listingPromise = () =>
    sdk.listings.show({
      id: bodyParams?.params?.listingId,
      include: ['author'],
      'fields.user': [],
    });

  Promise.all([listingPromise(), fetchCommission(sdk), currentUserPromise()])
    .then(async ([showListingResponse, fetchAssetsResponse, currentUserResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];
      const providerId = showListingResponse.data.included[0].id.uuid;
      const customerId = currentUserResponse.data.data.id.uuid;

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
      const { status, statusText, data } = apiResponse;
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
