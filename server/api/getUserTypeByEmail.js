const { getIntegrationSdk } = require('../api-util/sdk');

module.exports = async (req, res) => {
  const integrationSdk = getIntegrationSdk();
  const { email } = req.params;

  try {
    const fetchedUser = await integrationSdk.users.show({ email });
    const userData = (fetchedUser && fetchedUser.data.data) || {};

    const { profile = {} } = userData.attributes || {};
    const { publicData = {} } = profile || {};
    const { userType = null } = publicData || {};

    res.status(200).send({ data: { userType } });
  } catch (err) {
    res.status(500).send(err.data);
  }
};
