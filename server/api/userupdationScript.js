const { getIntegrationSdk } = require('../api-util/sdk');

const integrationSdk = getIntegrationSdk();

module.exports.userupdationScript = async (req, res) => {
  try {
    const users = await integrationSdk.users.query({ pub_userType: 'partner' });

    let count = 0;
    users.data.data.forEach(async user => {
      if (user.attributes.profile.privateData.subscriptionDetails) {
        await integrationSdk.users.updateProfile({
          id: user.id,
          protectedData: {
            // subscriptionDetails: user.attributes.profile.privateData.subscriptionDetails,
            subscriptionStatus:
              user.attributes.profile.privateData.subscriptionDetails.subscriptionStatus,
            isSubscriptionCancelled:
              user.attributes.profile.privateData.subscriptionDetails.subscriptionStatus ===
              'canceled',
            // subscriptionId: null,
          },
        });
        count++;
        console.log(user.attributes.profile.privateData.subscriptionDetails, user.id.uuid, count);
      }
    });
    res.status(200).send(users);
  } catch (error) {
    res.status(401).send(err.data.errors[0].source);
  }
};
