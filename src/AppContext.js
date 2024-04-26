import axios from 'axios';
import React, { createContext, useContext } from 'react';
import { apiBaseUrl } from './util/api';

const ENDPOINT = process.env.REACT_APP_DATA_API_URL;

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const handleConversation = message => {
    console.log('executting');
    setIsLoadingChatMessages(true);
    setAgentMessages(prevMessages => [...prevMessages, { userMessage: message }]);
    axios
      .post(
        `${apiBaseUrl()}/api/chat/text-input`,
        { message: message || 'Hi' },
        { withCredentials: true }
      )
      .then(res => {
        console.log('565', res.data);
        setAgentMessages(prevMessages => [...prevMessages, res.data.data[0].queryResult]);
        setIsLoadingChatMessages(false);
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

  const closeChatWindow = () => {
    setChatWindowOpen(false);
  };

  const openChatWindow = () => {
    setChatWindowOpen(true);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
