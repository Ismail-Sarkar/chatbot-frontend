const mongoose = require('mongoose');
const { getUserBySharetribeId } = require('./userModel');
const moment = require('moment');
const PER_PAGE = 10;

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
  page,
  isCustomer = false,
  perPage = PER_PAGE
) => {
  const hasPage = page && typeof page === 'number';
  const pageMaybe = hasPage
    ? { $skip: (page - 1) * PER_PAGE }
    : { $project: { id: 1, bookingStartDate: 1 } };
  const perPageMaybe = hasPage
    ? { $limit: perPage }
    : { $project: { id: 1, bookingStartDate: 1 } };

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

  const bookingStartDate =
    bookingStart &&
    moment
      .utc(bookingStart)
      .startOf('day')
      .toDate();
  const bookingEndDate =
    bookingEnd &&
    moment
      .utc(bookingEnd)
      .endOf('day')
      .toDate();
  const bookingStartQuery =
    !!bookingStart && !!bookingEnd
      ? {
          $and: [
            { bookingStartDate: { $gte: bookingStartDate } },
            { bookingStartDate: { $lte: bookingEndDate } },
          ],
        }
      : !!bookingStart
      ? {
          $and: [
            {
              bookingStartDate: {
                $gte: bookingStartDate,
              },
            },
            {
              bookingStartDate: {
                $lte: moment
                  .utc(bookingStart)
                  .endOf('day')
                  .toDate(),
              },
            },
          ],
        }
      : !!bookingEnd
      ? {
          $and: [
            {
              bookingStartDate: {
                $gte: moment
                  .utc(bookingEnd)
                  .startOf('day')
                  .toDate(),
              },
            },
            {
              bookingStartDate: {
                $lte: bookingEndDate,
              },
            },
          ],
        }
      : {};
  const query = {
    ...userNameAndConfirmNumberAndQuery,
    ...bookingStartQuery,
  };
  console.log(bookingStartQuery['$and']);
  const localFieldName = isCustomer ? 'providerId' : 'customerId';
  const aqgregateQuery = [
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
  ];
  let totalTransactions = 0;
  if (hasPage) {
    const transactions = await Transaction.aggregate(aqgregateQuery).exec();
    totalTransactions = transactions.length;
  }
  const transactions = await Transaction.aggregate([
    ...aqgregateQuery,
    pageMaybe,
    perPageMaybe,
  ]).exec();

  const meta = {
    totalItems: hasPage ? totalTransactions : transactions.length,
    totalPages: hasPage ? Math.round(totalTransactions / perPage) : 1,
    ...(hasPage ? { page, perPage } : {}),
  };
  return {
    data: transactions,
    meta,
  };
};
