const router = require('express').Router();
const { getIntegrationSdk, getSdk } = require('../api-util/sdk');

const { captureCustomPaymentIntent, updatePaymentIntent } = require('../api-util/stripeHelper');
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

router.post('/capturePaymentIntent', capturePaymentIntent);

module.exports = router;
