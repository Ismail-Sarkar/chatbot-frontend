const { default: axios } = require('axios');
const moment = require('moment');
const { setCurrencyExchangeCode } = require('../mongoCollections/CurrencyExchanngeCode');
const accessKey = process.env.CURRENCY_API_KEY;
const baseCurrency = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;

module.exports.fecthCurrency = async () => {
  try {
    const response = await axios.get(
      `https://api.apilayer.com/exchangerates_data/latest?base=${baseCurrency}&symbols=AUD, NZD, USD, EUR, FJD, WST, TOP`,
      {
        headers: {
          apikey: accessKey,
        },
      }
    );

    const { data } = response || {};

    const result = await setCurrencyExchangeCode({
      rates: data.rates,
      date: moment(data.date, 'yyyy-MM-DD').toISOString(),
      baseCurrency: data.base,
    });

    return result;

    // res.status(200).send(response);
  } catch (e) {
    console.log(e);
    return e;
    // res.status(500).send(e);
  }
};
