const { Worker, parentPort, workerData, isMainThread } = require('node:worker_threads');
const moment = require('moment');

const transactionToListen = [
  'transition/cancel',
  'transition/operator-decline',
  'transition/expire-payment',
];

const filterFunc = (txArrs, lastTx, lastTxAt, curDate) => {
  if (lastTxAt !== undefined && curDate !== undefined) {
    return txArrs.includes(lastTx) && moment.utc(lastTxAt).diff(curDate, 'minutes') > 0;
  } else {
    return txArrs.includes(lastTx);
  }
};

const getRequiredData = txArrs =>
  txArrs.map(txDetails => {
    const { attributes } = txDetails;
    const { resource } = attributes;
    const { relationships, ...rest } = resource;
    return { ...rest, ...relationships };
  });

const { data, curDate: currentDate } = workerData;
const lastTxId = data.length > 0 ? data[data.length - 1].attributes.sequenceId : null;

const filteredTxData = data.filter(d => {
  const { lastTransition, lastTransitionedAt } = d.attributes.resource.attributes;
  return filterFunc(transactionToListen, lastTransition);
});

const message = {
  lastTxId,

  filteredTxData: getRequiredData(filteredTxData),
};

parentPort.postMessage(message);
