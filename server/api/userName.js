const { getIntegrationSdk } = require('../api-util/sdk');

const integrationSdk = getIntegrationSdk();
module.exports.fetchByUserName = async (req, response) => {
  const userName = req.params.slug;

  if (!userName) {
    return response.status(404).send('slug required');
  }
  try {
    const res = await integrationSdk.users.query({ pub_profileUrl: userName });
    response.status(200).send(res.data.data);
  } catch (err) {
    return response.status(500).send(err);
  }
};

module.exports.checkAvailabilityOfUserName = async (req, response) => {
  const userName = req.params.slug;
  if (!userName) {
    return reject(new Error('slug required', err));
  }
  try {
    const res = await integrationSdk.users.query({ pub_profileUrl: userName });
    if (res.data.data.length > 0) {
      return response.status(409).send('Not available');
    }
    return response.status(200).send('available');
  } catch (e) {
    console.log(e);
    return response.status(500).send(e);
  }
};
