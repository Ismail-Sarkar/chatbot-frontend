const router = require('express').Router();
const { getIntegrationSdk, getSdk } = require('../api-util/sdk');

const { captureCustomPaymentIntent, updatePaymentIntent } = require('../api-util/stripeHelper');
const {
  searchTransactionsBy,
  updateTransactionConfirmNumber,
  updateTransactionStatus,
} = require('../models/transactionModel');
const integrationSdk = getIntegrationSdk();

const capturePaymentIntent = async (req, res) => {
  const { txId } = req.body;

  try {
    const tx = await integrationSdk.transactions.show({
      id: txId,
    });
    const { data } = tx.data;
    const { protectedData } = data.attributes;
    const paymentId = protectedData.stripePaymentIntents.default.stripePaymentIntentId; //needs to be replace later with modified id

    const updatedPaymentIntent = await updatePaymentIntent(paymentId, txId);
    const payment = await captureCustomPaymentIntent(paymentId);

    res.status(200).send(payment);
  } catch (err) {
    console.error(err?.data);
    res.status(500).send(err);
  }
};

const transactionSearch = async (req, res) => {
  try {
    const { type } = req.params;
    const sdk = await getSdk(req, res);
    const currentUser = (await sdk.currentUser.show({ 'fields.currentUser': [] })).data.data;
    const userId = currentUser.id.uuid;

    if (!['customer', 'provider'].includes(type)) {
      return res.status(400).send('Invalid details.');
    }
    const isCustomer = type === 'customer';

    const { bookingStart, userNameAndConfirmNumber, bookingEnd, page, perPage } = req.query;

    if (!bookingStart && !userNameAndConfirmNumber && !bookingEnd) {
      return res.status(400).send('Invalid details.');
    }
    const transactionsId = await searchTransactionsBy(
      userNameAndConfirmNumber,
      bookingStart,
      bookingEnd,
      userId,
      page ? parseInt(page) : page,
      isCustomer,
      perPage
    );
    res.status(200).send(transactionsId || []);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};
const updateTransactionDetails = async (req, res) => {
  try {
    const { id, confirmNumber } = req.body;
    if (id && confirmNumber) {
      await updateTransactionConfirmNumber(id, confirmNumber);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
};

const updateTransactionCurrentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (id && status) {
      await updateTransactionStatus(id, status);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
};

router.post('/capturePaymentIntent', capturePaymentIntent);
router.get('/:type', transactionSearch);
router.post('/update', updateTransactionDetails);
router.post('/update-status', updateTransactionCurrentStatus);

module.exports = router;
