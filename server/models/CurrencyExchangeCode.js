const mongoose = require('mongoose');
const { CustomError } = require('../api-util/errorHelper');

const requiredFields = ['date', 'baseCurrency', 'rates'];

const currencyExchangeCodeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    baseCurrency: { type: String, required: true },
    rates: { type: Object, required: true },
  },
  { timestamps: true }
);

const CurrencyExchangeCode = mongoose.model('CurrencyExchangeCode', currencyExchangeCodeSchema);

module.exports.CurrencyExchangeCode = CurrencyExchangeCode;

module.exports.setCurrencyExchangeCode = async data => {
  const schemaKeys = Object.keys(data);
  const hasAllFields = schemaKeys.every(field => requiredFields.includes(field));
  if (!hasAllFields) {
    throw new CustomError('Missing required details.', 400);
  }

  const { date, baseCurrency, rates } = data;
  try {
    const currencyExchangeCode = await CurrencyExchangeCode.create({
      date,
      baseCurrency,
      rates,
    });
    return currencyExchangeCode;
  } catch (err) {
    throw new CustomError(err);
  }
};

module.exports.getLatestCurrencyExchangeCode = async req => {
  try {
    const currencyExchangeCode = await CurrencyExchangeCode.findOne(
      {},
      { _id: 0, baseCurrency: 1, rates: 1, date: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(1);
    return currencyExchangeCode;
  } catch (err) {
    throw new CustomError(err);
  }
};
