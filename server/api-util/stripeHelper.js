const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getKey } = require('./encryptHelper');

const retrievePaymentMethod = async paymentMethodId => {
  const { card, customer } = await stripe.paymentMethods.retrieve(paymentMethodId);

  return { customer };
};

const createCustomPaymentIntent = async info => {
  const {
    listingId,
    providerId,
    customerId,
    paymentMethodId,
    currency,
    description,
    amount,
  } = info;
  if (paymentMethodId) {
    const { customer } = await retrievePaymentMethod(paymentMethodId);
    // console.log(customer);
    const newPaymentIntent = await stripe.paymentIntents.create({
      payment_method: paymentMethodId,
      customer,
      payment_method_types: ['card'],
      capture_method: 'manual', // Set capture_method to manual

      confirm: 'true',
      description,
      metadata: {
        'sharetribe-platform': 'sharetribe',
        'sharetribe-customer-id': customerId,
        'sharetribe-provider-id': providerId,
      },

      currency,
      confirmation_method: 'automatic',
      amount,
    });

    // console.log(charge, 'charge');
    return newPaymentIntent;
  }

  const newPaymentIntent = await stripe.paymentIntents.create({
    payment_method_types: ['card'],
    capture_method: 'manual', // Set capture_method to manual

    confirm: 'false',
    description,
    metadata: {
      'sharetribe-platform': 'sharetribe',
      'sharetribe-customer-id': customerId,
      'sharetribe-provider-id': providerId,
    },

    currency,
    confirmation_method: 'automatic',
    amount,
  });

  return newPaymentIntent;
};

const updatePaymentIntent = async (paymentId, txId) => {
  const paymentIntent = await stripe.paymentIntents.update(paymentId, {
    metadata: { 'sharetribe-transaction-id': txId },
  });
  return paymentIntent;
};

const captureCustomPaymentIntent = async paymentId => {
  // const paymentIntent = await stripe.paymentIntents.update(paymentId, {
  //   transfer_data: {
  //     destination: stripeAccountId,
  //   },
  // });

  // Capture the payment
  const payment = await stripe.paymentIntents.capture(paymentId);
  return payment;
};

const cancelCustomPaymentIntent = async paymentId => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

  if (paymentIntent.status === 'requires_capture') {
    const cancelPaymentIntent = await stripe.paymentIntents.cancel(paymentId);
    return cancelPaymentIntent;
  } else {
    throw new Error('Can not cancel paymentintent as it has no require capture status');
  }
};

const refund = async paymentIntentId => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
  return refund;
};

module.exports = {
  createCustomPaymentIntent,
  updatePaymentIntent,
  captureCustomPaymentIntent,
  cancelCustomPaymentIntent,
};
