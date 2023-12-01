const generateNanoId = require('../api-util/nanoIdGenerator');

const getUniqueId = (req, res) => {
  const nanoId = generateNanoId();
  res.json({ nanoId });
};

module.exports = { getUniqueId };
