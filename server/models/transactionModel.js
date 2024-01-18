const mongoose = require('mongoose');
const { getUserBySharetribeId } = require('./userModel');

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
  userId,
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

  const user = await getUserBySharetribeId(userId);
  if (!user) throw new Error('User not found');

  const queryFor = isCustomer
    ? { customerId: user._id }
    : { providerId: user._id };
  const bookingStartDate = bookingStart && new Date(bookingStart);
  const bookingEndDate = bookingEnd && new Date(bookingEnd);
  const bookingStartQuery =
    !!bookingStart && !!bookingEnd
      ? {
          $and: [
            { bookingStartDate: { $gte: bookingStartDate } },
            { bookingStartDate: { $lte: bookingEndDate } },
          ],
        }
      : !!bookingStart
      ? { bookingStartDate: bookingStartDate }
      : !!bookingEnd
      ? { bookingStartDate: bookingEndDate }
      : {};

  const query = {
    ...userNameAndConfirmNumberAndQuery,
    ...bookingStartQuery,
  };

  const localFieldName = isCustomer ? 'providerId' : 'customerId';
  const transactions = await Transaction.aggregate([
    { $match: queryFor },
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
    {
      $project: {
        _id: 0,
        id: '$transactionId',
        bookingStartDate: 1,
      },
    },
  ]).exec();
  return transactions;
};
