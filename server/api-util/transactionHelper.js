const { addTransaction } = require('../models/transactionModel');
const { addUser } = require('../models/userModel');

module.exports.addTransactionDetails = async (
  customerDetails,
  providerDetails,
  transactionDetails,
  bookingStartDate,
  timeZone
) => {
  const {
    id: { uuid: customerId },
    attributes: {
      profile: { firstName: cFirstName, lastName: cLastName },
    },
  } = customerDetails;
  const {
    id: { uuid: providerId },
    attributes: {
      profile: { firstName: pFirstName, lastName: pLastName },
    },
  } = providerDetails;
  const {
    id: { uuid: transactionId },
    attributes: {
      protectedData: { confirmationNumber },
    },
  } = transactionDetails;
  const customerUserName = `${cFirstName}${cLastName}`;
  const providerUserName = `${pFirstName}${pLastName}`;
  const [mongoCustomer, mongoProvider] = await Promise.all([
    addUser(customerId, customerUserName),
    addUser(providerId, providerUserName),
  ]);
  const transaction = await addTransaction(
    transactionId,
    mongoCustomer._id,
    mongoProvider._id,
    confirmationNumber,
    bookingStartDate,
    timeZone
  );
  return transaction;
};
