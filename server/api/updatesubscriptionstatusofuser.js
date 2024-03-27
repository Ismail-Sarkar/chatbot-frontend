const { getIntegrationSdk } = require('../api-util/sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const integrationSdk = getIntegrationSdk();

exports.createSubscriptionofUser = async (req, res) => {
  try {
    const { data } = req.body;

    console.log('WebHook status: Hitted create', req.body);
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
            const isSubscriptionCancelled = status === 'canceled';

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
              protectedData: {
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
                subscriptionId: data.object.subscription,
                subscriptionStatus: status,
                isSubscriptionCancelled,
              },
            };

            console.log('Subscription Details:', dataToUpdate.protectedData.subscriptionDetails);

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

exports.renewSubscriptionofUser = async (req, res) => {
  try {
    if (req.body.type !== 'customer.subscription.updated')
      return res.status(200).send('not a subscription renewal');

    try {
      const { id: subscriptionId } = req.body.data.object;
      const userDetails = await integrationSdk.users.query({ prot_subscriptionId: subscriptionId });

      const userData = userDetails.data.data[0];

      const { data } = req.body;

      console.log('WebHook status: Hitted', req.body);
      if (data) {
        if (userData?.id?.uuid && data.object.object === 'subscription') {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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

              const dataToUpdate = {
                id: userData?.id?.uuid,
                publicData: {
                  subScriptionOn: {
                    subscriptionStart: startDate,
                    subscriptionEnd: endDate,
                  },
                },
                protectedData: {
                  subscriptionDetails: {
                    subscriptionId: subscriptionId,
                    subscriptionStatus: status,
                    subscriptionStart: startDate,
                    subscriptionEnd: endDate,
                    subscriptionType: subscriptionType,
                    subscriptionEmail:
                      userData?.attributes?.profile?.protectedData?.subscriptionDetails
                        ?.subscriptionEmail,
                    subscriberName:
                      userData?.attributes?.profile?.protectedData?.subscriptionDetails
                        ?.subscriberName,
                    discountedPercent: subscription.discount?.coupon?.percent_off
                      ? subscription.discount?.coupon?.percent_off
                      : 0,
                    discountAmount: subscription.discount?.coupon?.percent_off
                      ? (subscriptionType.recurring * subscription.discount.coupon?.percent_off) /
                        100
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

              console.log('Subscription Details:', dataToUpdate.protectedData.subscriptionDetails);

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
    } catch (userFoundError) {
      console.log('User data not found.....', userFoundError);
      res.status(401).send({ message: 'User data not found', error: err.data.errors[0].source });
    }
  } catch (err) {
    console.log('Error hitting webhook', err);
    //   res.status(401).send({ message: 'Profile not updated', error: err.data.errors[0].source });
    res.status(401).send({ message: 'Error hitting webhook', error: err });
  }
};

module.exports.removeSubscriptionofUser = async (req, res) => {
  try {
    const { subsId, userId } = req.body;
    if (!subsId) {
      return res.status(400).send('Invalid data!.');
    }
    const userDetails = await integrationSdk.users.query({ prot_subscriptionId: subsId });

    const userData = userDetails.data.data[0];
    const cancelledSubscription = await stripe.subscriptions.cancel(subsId);
    const cancelStatus = cancelledSubscription.status.toLowerCase();
    const isSubscriptionCancelled = cancelStatus === 'canceled';
    const subscription = await stripe.subscriptions.retrieve(subsId);
    console.log(subscription, 785);

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

      const dataToUpdate = {
        id: userData?.id?.uuid,

        protectedData: {
          subscriptionDetails: {
            subscriptionId: subsId,
            subscriptionStatus: status,
            subscriptionStart: startDate,
            subscriptionEnd: endDate,
            subscriptionType: subscriptionType,
            subscriptionEmail:
              userData?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEmail,
            subscriberName:
              userData?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriberName,
            discountedPercent: subscription.discount?.coupon?.percent_off
              ? subscription.discount?.coupon?.percent_off
              : 0,
            discountAmount: subscription.discount?.coupon?.percent_off
              ? (subscriptionType.recurring * subscription.discount.coupon?.percent_off) / 100
              : 0,
            discountedAmount: subscription.discount?.coupon?.percent_off
              ? subscriptionType.recurring -
                (subscriptionType.recurring * subscription.discount?.coupon?.percent_off) / 100
              : subscriptionType.recurring,
            totalAmount: subscriptionType.recurring,
          },
          isSubscriptionCancelled,
          subscriptionStatus: cancelStatus,
        },
      };

      console.log('Subscription Details:', dataToUpdate.protectedData.subscriptionDetails);

      try {
        const updatedProfile = await integrationSdk.users.updateProfile(dataToUpdate, {
          expand: true,
        });
        //   res.status(200).send({ data: resp.data.data });
        res.status(200).send({
          message: 'Unsubscribed and Profile updated successfully',
          subscriptionDetails: dataToUpdate,
          updatedProfileDetails: updatedProfile,
        });
      } catch (err) {
        console.log(69, err.data.errors[0].source);
        res.status(401).send({ message: 'Profile not updated', error: err.data.errors[0].source });
      }
    } else {
      res.status(401).send({ message: 'Subscription data not found' });
    }
    // await integrationSdk.users.updateProfile({
    //   id: userId,
    //   protectedData: { isSubscriptionCancelled, subscriptionStatus: cancelStatus },
    // });
    // res.status(200).send('Unsubscribed successfully');
  } catch (error) {
    console.log(error.message, 78);
    return res.status(500).send(error.message);
  }
};
