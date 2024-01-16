const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    transactionConfirmNumber: { type: String },
    bookingStartDate: { type: Date },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('transaction', TransactionSchema);

module.exports.addTransaction = async (
  transactionId,
  customerId,
  providerId,
  transactionConfirmNumber,
  bookingStartDate
) => {
  const savedTransaction = await Transaction.findOne({ transactionId }, null, {
    lean: true,
  }).exec();
  if (!!savedTransaction) return savedTransaction;
  const transaction = await Transaction.create({
    transactionId,
    customerId,
    providerId,
    bookingStartDate,
    transactionConfirmNumber,
  });
  return transaction;
};

module.exports.updateTransactionConfirmNumber = async (id, confirmNumber) => {
  const data = await Transaction.findOneAndUpdate(
    {
      transactionId: id,
    },
    { transactionConfirmNumber: confirmNumber },
    { lean: true, new: true }
  ).exec();
  return data;
};

module.exports.searchTransactionsBy = async (
  userNameAndConfirmNumber,
  bookingStart,
  bookingEnd,
  isCustomer = false
) => {
  const userNameAndConfirmNumberAndQuery = !!userNameAndConfirmNumber
    ? {
        $or: [
          { transactionConfirmNumber: userNameAndConfirmNumber },
          { 'user.userName': { $regex: userNameAndConfirmNumber } },
        ],
      }
    : {};
  const bookingStartQuery =
    !!bookingStart && !!bookingEnd
      ? {
          $and: [
            { bookingStartDate: { $gte: bookingStart } },
            { bookingStartDate: { $lte: bookingEnd } },
          ],
        }
      : !!bookingStart
      ? { bookingStartDate: bookingStart }
      : !!bookingEnd
      ? { bookingStartDate: bookingEnd }
      : {};
  const query = {
    ...userNameAndConfirmNumberAndQuery,
    ...bookingStartQuery,
  };
  const localFieldName = isCustomer ? 'providerId' : 'customerId';
  const transactions = await Transaction.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: localFieldName,
        foreignField: '_id',
        as: 'users',
      },
    },
    {
      $project: {
        transactionId: 1,
        bookingStartDate: 1,
        transactionConfirmNumber: 1,
        createdAt: 1,
        user: { $arrayElemAt: ['$users', 0] },
      },
    },
    { $match: query },
    { $project: { _id: 0, transactionId: 1, id: '$transactionId' } },
  ]).exec();
  return transactions;
};
