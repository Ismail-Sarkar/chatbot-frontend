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
    timeZone: { type: String },
    bookingStartDate: { type: Date },
    status: { type: String, default: 'pending' },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('transaction', TransactionSchema);

module.exports.addTransaction = async (
  transactionId,
  customerId,
  providerId,
  transactionConfirmNumber,
  bookingStartDate,
  timeZone
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
    timeZone,
  });
  return transaction;
};

module.exports.updateTransactionConfirmNumber = async (id, confirmNumber) => {
  const data = await Transaction.findOneAndUpdate(
    {
      transactionId: id,
    },
    { transactionConfirmNumber: confirmNumber, status: 'accepted' },
    { lean: true, new: true }
  ).exec();
  return data;
};

module.exports.updateTransactionStatus = async (id, status) => {
  const data = await Transaction.findOneAndUpdate(
    {
      transactionId: id,
    },
    { status: status }
  ).exec();
  return data;
};

module.exports.bulkUpdateTransactionStatus = async (transactionIds, status) => {
  const filter = {
    $and: [
      { transactionId: { $in: transactionIds } },
      { $or: [{ status: { $ne: status } }, { status: { $exists: false } }] },
    ],
  };

  const update = {
    $set: { status },
  };

  const options = { multi: true };

  Transaction.updateMany(filter, update, options, function(err, result) {
    if (err) {
      throw err;
    } else {
      return result;
    }
  });
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
    : { $project: { id: 1, bookingStartDate: 1, timeZone: 1 } };
  const perPageMaybe = hasPage
    ? { $limit: perPage }
    : { $project: { id: 1, bookingStartDate: 1, timeZone: 1 } };

  const userNameAndConfirmNumberAndQuery = !!userNameAndConfirmNumber
    ? {
        $or: [
          { transactionConfirmNumber: userNameAndConfirmNumber },
          { 'user.userName': { $regex: new RegExp(userNameAndConfirmNumber, 'i') } },
        ],
      }
    : {};

  const user = await getUserBySharetribeId(userId);
  if (!user) throw new Error('User not found');

  const queryFor = isCustomer ? { customerId: user._id } : { providerId: user._id };
  const timezone = moment.tz.guess();
  const offset = moment.tz.zone(timezone).utcOffset();
  const bookingRangeStartDate =
    bookingStart &&
    moment(bookingStart)
      .startOf('day')
      .subtract(offset, 'minutes')
      .toDate();

  const bookingRangeEndDate =
    bookingEnd &&
    moment(bookingEnd)
      .endOf('day')
      .subtract(offset, 'minutes')
      .toDate();

  const bookingStartDate =
    bookingStart &&
    moment(bookingStart)
      .subtract(offset, 'minutes')
      .toDate();

  const bookingStartDateEnd =
    bookingStart &&
    moment(bookingStart)
      .add(1, 'day')
      .subtract(offset + 1, 'minutes')
      .toDate();

  const bookingEndDate =
    bookingEnd &&
    moment(bookingEnd)
      .subtract(offset + 1, 'minute')
      .toDate();

  const bookingEndDateStart =
    bookingEnd &&
    moment(bookingEnd)
      .subtract(1, 'day')
      .subtract(offset, 'minutes')
      .toDate();

  const bookingStartQuery =
    !!bookingStart && !!bookingEnd
      ? {
          $and: [
            { bookingStartDate: { $gte: bookingRangeStartDate } },
            { bookingStartDate: { $lte: bookingRangeEndDate } },
            { status: { $ne: 'canceled' } },
            { status: { $ne: 'declined' } },
            { status: { $ne: 'expired' } },
            { status: { $ne: 'pending' } },
          ],
        }
      : !!bookingStart
      ? {
          $and: [
            {
              bookingStartDate: {
                // $gte: moment(bookingStart).toDate(),
                $gte: bookingStartDate,
              },
            },
            {
              bookingStartDate: {
                $lte: bookingStartDateEnd,
                // $lte: moment(bookingStart)
                //   .clone()
                //   .add(1, 'day')
                //   .subtract(1, 'minute')
                //   .toDate(),
              },
            },
          ],
        }
      : !!bookingEnd
      ? {
          $and: [
            {
              bookingStartDate: {
                $gte: bookingEndDateStart,
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
        timeZone: 1,
        createdAt: 1,
        status: 1,
        user: { $arrayElemAt: ['$users', 0] },
      },
    },
    { $match: query },
    {
      $project: {
        _id: 0,
        id: '$transactionId',
        bookingStartDate: 1,
        timeZone: 1,
        status: 1,
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
