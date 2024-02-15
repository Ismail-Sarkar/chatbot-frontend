const { getIntegrationSdk } = require('./api-util/sdk');
const integrationSdk = getIntegrationSdk();
const { Worker } = require('node:worker_threads');
const path = require('path');
const { bulkUpdateTransactionStatus } = require('./models/transactionModel');
const { isEmpty } = require('lodash');

const workerFilename = path.resolve(__dirname, './', 'api-util/', 'eventFilters');
const eventIntervalInMinute = 1;
const PER_PAGE = 20;

const sequenceIds = { tx: 0, isWorkerThreadExit: true, eventInterval: eventIntervalInMinute };
const eventTypes = {
  transaction: 'transaction/transitioned',
};

const resolveWorkerResult = async data => {
  const { lastTxId, filteredTxData } = data;
  if (lastTxId !== null && lastTxId !== undefined && typeof lastTxId === 'number') {
    sequenceIds.tx = lastTxId;
  }
  sequenceIds.eventInterval = eventIntervalInMinute;
  const declinedTransactions = [],
    canceledTransactions = [],
    expiredTransactions = [];
  filteredTxData.forEach(({ id, attributes }) => {
    const { lastTransition } = attributes;
    const { uuid } = id;
    switch (lastTransition) {
      case 'transition/cancel': {
        canceledTransactions.push(uuid);
        break;
      }
      case 'transition/operator-decline': {
        declinedTransactions.push(uuid);
        break;
      }
      case 'transition/expire-payment': {
        expiredTransactions.push(uuid);
        break;
      }
      default: {
        console.log('unknown transition');
      }
    }
  });

  try {
    const promises = [];
    if (!isEmpty(declinedTransactions)) {
      promises.push(bulkUpdateTransactionStatus(declinedTransactions, 'declined'));
    }
    if (!isEmpty(expiredTransactions)) {
      promises.push(bulkUpdateTransactionStatus(expiredTransactions, 'expired'));
    }
    if (!isEmpty(canceledTransactions)) {
      promises.push(bulkUpdateTransactionStatus(canceledTransactions, 'canceled'));
    }
    await Promise.all(promises);
  } catch (err) {
    console.log(err);
  }
};

const onWorkerExit = code => {
  if (code !== 0) {
    throw new Error(`Worker stopped with exit code ${code}`);
  } else {
    sequenceIds.eventInterval = eventIntervalInMinute;
    sequenceIds.isWorkerThreadExit = true;
  }
};

const listeners = [];
const transactionEventListener = async () => {
  try {
    const resp = await integrationSdk.events.query({
      eventTypes: eventTypes.transaction,
      ...(!!sequenceIds.tx && { startAfterSequenceId: sequenceIds.tx }),
    });

    if (sequenceIds.isWorkerThreadExit) {
      sequenceIds.isWorkerThreadExit = false;
      const curDate = { interval: sequenceIds.eventInterval, type: 'minutes' };
      const { data } = resp.data;
      const workerData = { data, curDate };
      const worker = new Worker(workerFilename, { workerData });
      worker.on('message', resolveWorkerResult);
      worker.on('exit', onWorkerExit);
    } else {
      sequenceIds.eventInterval += eventIntervalInMinute;
    }
  } catch (err) {
    console.error(err);
  }
};

listeners.push(transactionEventListener);
module.exports.listeners = listeners;
