require('dotenv').config();

const express = require('express');
const Dialogflow = require('@google-cloud/dialogflow');
const { v4: uuid } = require('uuid');
const Path = require('path');
const { default: axios } = require('axios');

const CHATBOT_BACKEND_URI = process.env.CHATBOT_BACKEND_URI || 'http://localhost:8000/dialog-flow';

const router = express.Router();

const sessionClient = new Dialogflow.SessionsClient({
  keyFilename: Path.join(__dirname, '../key.json'),
});

const sessions = {};

router.post('/text-input', async (req, res) => {
  const { clientId, message, context } = req.body;

  let sessionPath = (clientId && sessions[clientId]) || null;
  console.log('sessionpath', sessionPath, clientId, sessions);

  if (!sessionPath) {
    // If not, create a new session
    sessionPath = sessionClient.projectAgentSessionPath('bit-bot-yinn', uuid());

    // Store the session ID
    sessions[sessionPath.split('/').pop()] = sessionPath;
  }

  // Create a new session

  // The dialogflow request object
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: message,
        languageCode: 'en-us', // needs to be dynamic
      },
    },

    contexts: context,
  };

  // Sends data from the agent as a response
  try {
    const responses = await sessionClient.detectIntent(request);

    // console.log(responses[0].queryResult.intent.displayName, 456);

    const intentName = responses[0]?.queryResult?.intent?.displayName || null;

    const outputContexts = responses[0]?.queryResult.outputContexts;

    // console.log(responses, responses[0]?.queryResult, 'response from agent');

    if (intentName === 'show.transaction' || intentName === 'show.more.orders') {
      console.log('first', outputContexts);

      try {
        const webhookServerResponse = await axios.post(
          CHATBOT_BACKEND_URI,
          {
            queryResult: {
              intent: {
                displayName:
                  intentName === 'show.transaction'
                    ? 'show.transaction.custom'
                    : 'show.more.orders.custom',
              },
              context: outputContexts,
              outputContexts,
              // outputContexts: {
              //   ...outputContexts,
              //   parameters: { ...outputContexts.parameters?.fields },
              // },
            },
          },
          {
            withCredentials: true,
            headers: {
              Cookie: req.headers.cookie, // Forward received cookies
            },
          }
        );

        console.log(webhookServerResponse.data, 876);
        return res.status(200).json({
          data: [{ queryResult: webhookServerResponse.data }],
          clientId: sessionPath.split('/').pop(),
        });
      } catch (err) {
        console.log(err);
      }
    } else res.status(200).json({ data: responses, clientId: sessionPath.split('/').pop() });
  } catch (e) {
    console.log(e);
    res.status(422).send({ e });
  }
});

module.exports = router;
