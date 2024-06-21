import axios from 'axios';
import React, { createContext, useContext } from 'react';
import { apiBaseUrl } from './util/api';

const ENDPOINT = process.env.REACT_APP_DATA_API_URL;

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const handleConversation = message => {
    setIsLoadingChatMessages(true);
    setAgentMessages(prevMessages => [...prevMessages, { userMessage: message }]);
    axios
      .post(
        `${apiBaseUrl()}/api/chat/text-input`,
        { message: message || 'Hi', clientId, context },
        { withCredentials: true }
      )
      .then(res => {
        setAgentMessages(prevMessages => [...prevMessages, res.data.data[0].queryResult]);
        setIsLoadingChatMessages(false);
        setClientId(res.data.clientId);
        setIntentName(res.data.intent);
        setContext(res.data.data[0].queryResult.outputContexts);
      })
      .catch(e => {
        setIsLoadingChatMessages(false);
        console.log(e);
      });
  };

  const initialState = {
    isChatWindowOpen: false,
    isLoadingChatMessages: false,
    agentMessages: [],
    handleConversation,
  };

  const [isChatWindowOpen, setChatWindowOpen] = React.useState(initialState.isChatWindowOpen);

  const [isLoadingChatMessages, setIsLoadingChatMessages] = React.useState(
    initialState.isLoadingChatMessages
  );
  const [agentMessages, setAgentMessages] = React.useState(initialState.agentMessages);

  const [clientId, setClientId] = React.useState(null);
  const [context, setContext] = React.useState([]);
  const [fullScreen, setFullScreen] = React.useState(false);
  const [intentName, setIntentName] = React.useState('');

  const closeChatWindow = () => {
    setChatWindowOpen(false);
  };

  const openChatWindow = () => {
    setChatWindowOpen(true);
  };

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  return (
    <AppContext.Provider
      value={{
        isChatWindowOpen,
        isLoadingChatMessages,
        agentMessages,
        handleConversation,
        closeChatWindow,
        openChatWindow,
        toggleFullScreen,
        isFullScreen: fullScreen,
        intentName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
