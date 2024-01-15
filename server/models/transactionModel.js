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
