const {
  getLatestCurrencyExchangeCode,
  getLatestCurrencyExchangeCodeOfCurrency,
} = require('../models/CurrencyExchangeCode');

const router = require('express').Router();

const latestExchangeCode = async (req, res) => {
  try {
    const latestExhcangeCode = await getLatestCurrencyExchangeCode();
    res.status(200).send(latestExhcangeCode);
  } catch (e) {
    res.send(e);
  }
};

const latestExchangeCodeOfCurrency = async (req, res) => {
  try {
    const CURRENCY = req.params.currency;
    const latestExhcangeCode = await getLatestCurrencyExchangeCodeOfCurrency(CURRENCY);
    res.status(200).send(latestExhcangeCode);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
};

router.get('/latestExchangeCode', latestExchangeCode);
router.get('/latestExchangeCodeOfCurrency/:currency', latestExchangeCodeOfCurrency);

module.exports = router;
