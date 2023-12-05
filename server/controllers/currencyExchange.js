const { getLatestCurrencyExchangeCode } = require('../models/CurrencyExchangeCode');

const router = require('express').Router();

const latestExchangeCode = async (req, res) => {
  try {
    const latestExhcangeCode = await getLatestCurrencyExchangeCode();
    res.status(200).send(latestExhcangeCode);
  } catch (e) {
    res.send(e);
  }
};

router.get('/latestExchangeCode', latestExchangeCode);

module.exports = router;
