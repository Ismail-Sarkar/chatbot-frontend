const { getSdk } = require('../api-util/sdk');

module.exports = async (req, res, next) => {
  const sdk = getSdk(req, res);

  try {
    const currentUser = await sdk.currentUser.show();
    const userData = currentUser && currentUser.data.data;

    if (!userData) {
      return res.status(401).send('Invalid user');
    }
    req.currentUser = userData;
    next();
  } catch (err) {
    res.status(500).send(err);
  }
};
