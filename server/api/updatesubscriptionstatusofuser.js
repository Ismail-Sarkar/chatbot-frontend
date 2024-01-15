const { getIntegrationSdk } = require('../api-util/sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const integrationSdk = getIntegrationSdk();

exports.updatesubscriptionstatusofuser = async (req, res) => {
  try {
    const { data } = req.body;

    // console.log('WebHook status: Hitted', req.body);
    if (data) {
      if (
        data.object.client_reference_id &&
        data.object.mode === 'subscription' &&
        data.object.subscription
      ) {
        try {
          const subscription = await stripe.subscriptions.retrieve(data.object.subscription);
          // console.log('Subscription Details:', subscription);
          // console.log('Subscription Items:', subscription.items.data);
          if (subscription) {
            // Extract the required information from the subscription object
            const status = subscription.status;
            const startDate = new Date(subscription.current_period_start * 1000).toISOString(); // Convert to a JavaScript date
            const endDate = new Date(subscription.current_period_end * 1000).toISOString(); // Convert to a JavaScript date

            // Retrieve the subscription type information with amount

            const subscriptionType = subscription.items.data.reduce((accumulator, item) => {
              const type = item.price.type;
              const unitAmount = item.price.unit_amount;

              // If the type doesn't exist in the accumulator, initialize it to 0
              if (!accumulator[type]) {
                accumulator[type] = 0;
              }

              // Add the unitAmount to the total for the current type
              accumulator[type] += unitAmount;

              return accumulator;
            }, {});
            integrationSdk.users.show({ id: data.object.client_reference_id }).then(res => {
              console.log(res);
            });

            const dataToUpdate = {
              id: data.object.client_reference_id,
              publicData: {
                subScriptionOn: {
                  subscriptionStart: startDate,
                  subscriptionEnd: endDate,
                },
              },
              privateData: {
                subscriptionDetails: {
                  subscriptionId: data.object.subscription,
                  subscriptionStatus: status,
                  subscriptionStart: startDate,
                  subscriptionEnd: endDate,
                  subscriptionType: subscriptionType,
                  subscriptionEmail: data.object.customer_details.email,
                  subscriberName: data.object.customer_details.name,
                  discountedPercent: subscription.discount?.coupon?.percent_off
                    ? subscription.discount?.coupon?.percent_off
                    : 0,
                  discountAmount: subscription.discount?.coupon?.percent_off
                    ? (subscriptionType.recurring * subscription.discount.coupon?.percent_off) / 100
                    : 0,
                  discountedAmount: subscription.discount?.coupon?.percent_off
                    ? subscriptionType.recurring -
                      (subscriptionType.recurring * subscription.discount?.coupon?.percent_off) /
                        100
                    : subscriptionType.recurring,
                  totalAmount: subscriptionType.recurring,
                },
              },
            };

            console.log('Subscription Details:', dataToUpdate.privateData.subscriptionDetails);

            try {
              const updatedProfile = await integrationSdk.users.updateProfile(dataToUpdate, {
                expand: true,
              });
              //   res.status(200).send({ data: resp.data.data });
              res.status(200).send({
                message: 'Profile updated successfully',
                subscriptionDetails: dataToUpdate,
                updatedProfileDetails: updatedProfile,
              });
            } catch (err) {
              console.log(69, err.data.errors[0].source);
              res
                .status(401)
                .send({ message: 'Profile not updated', error: err.data.errors[0].source });
            }
          } else {
            res.status(401).send({ message: 'Subscription data not found' });
          }
        } catch (err) {
          console.log('Subscription data fetch error.....', err);
          res.status(401).send({ message: 'Subscription data fetch error', error: err });
        }
      }
    }

    // res.status(200).send({ message: 'WebHook status: Hitted' });
  } catch (err) {
    console.log('Error hitting webhook', err);
    //   res.status(401).send({ message: 'Profile not updated', error: err.data.errors[0].source });
    res.status(401).send({ message: 'Error hitting webhook', error: err });
  }
};
