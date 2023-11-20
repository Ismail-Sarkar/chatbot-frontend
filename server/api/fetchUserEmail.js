const { getIntegrationSdk } = require('../api-util/sdk');

module.exports = async (req, res) => {
  const integrationSdk = getIntegrationSdk();
  const { userId } = req.params;

  try {
    const fetchedUser = await integrationSdk.users.show({ id: userId });
    const userData = (fetchedUser && fetchedUser.data.data) || {};

    const { email = null } = userData.attributes || {};

    if (!userData) {
      return res.status(401).send('Invalid user');
    }
    res.status(200).send({ data: { email } });
  } catch (err) {
    res.status(500).send(err.data);
  }
};
