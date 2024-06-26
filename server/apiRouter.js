/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');

const createUserWithIdp = require('./api/auth/createUserWithIdp');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');
const transactionsRouter = require('./api/transactions');
const {
  createSubscriptionofUser,
  renewSubscriptionofUser,
  removeSubscriptionofUser,
} = require('./api/updatesubscriptionstatusofuser');
const fetchUserEmail = require('./api/fetchUserEmail');
const getUserTypeByEmail = require('./api/getUserTypeByEmail');
const currencyExchangeCode = require('./controllers/currencyExchange');
const { fetchByUserName, checkAvailabilityOfUserName } = require('./api/userName');
const { getUniqueId } = require('./controllers/nanoIdController');
const { fecthCurrency } = require('./cron-jobs/currencyUpdater');
const { cronScheduler, cronTimers } = require('./api-util/cronSchedular');
const { userupdationScript } = require('./api/userupdationScript');
const { listeners } = require('./eventListeners');

const agentRouter = require('./agentRouter.js');

const router = express.Router();

const fetchCur = async () => {
  try {
    const data = await fecthCurrency();
    console.log(data);
  } catch (e) {
    console.log(e);
  }
};

//==============Mongo db connection=================//

require('./mongo-config');

//============cron tab scheduler =================//
cronScheduler(cronTimers.everyMidnight, fetchCur);

cronScheduler(cronTimers.everyMinute, () => {
  console.log('calling listener');
  listeners.forEach(listener => {
    if (typeof listener === 'function') listener();
  });
});
// fetchCur();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/google/callback', authenticateGoogleCallback);

router.post('/createSubscriptionofUser', createSubscriptionofUser);
router.post('/renewSubscriptionofUser', renewSubscriptionofUser);
router.post('/unsubscribeSubscriptionofUser', removeSubscriptionofUser);

// router.get('/userupdationScript', userupdationScript);

//transactionRouter

router.use('/transaction', transactionsRouter);

//fetch user email

router.get('/getProviderMail/:userId', fetchUserEmail);
router.get('/getUserType/:email', getUserTypeByEmail);

//User name
router.get('/fetchByUserName/:slug', fetchByUserName);
router.get('/checkAvailabilityOfUserName/:slug', checkAvailabilityOfUserName);

//currency exchange
router.use('/currency', currencyExchangeCode);

//uniqe id
router.get('/uniqueId', getUniqueId);

router.use('/chat', agentRouter);

module.exports = router;
