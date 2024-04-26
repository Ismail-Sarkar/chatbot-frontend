// Chat.js

import React, { useState } from 'react';
import './Chat.css';
import ChatComponent from '../ChatComponent';
import ChatIcon from '../ChatIcon/ChatIcon';
import { useAppContext } from '../../../AppContext';

const Chat = () => {
  const { openChatWindow, isChatWindowOpen } = useAppContext();

  return (
    <>
      <ChatIcon onClick={openChatWindow} />
      <div className={`chat-wrapper ${isChatWindowOpen ? 'open' : ''}`}>
        <ChatComponent closeChatWindow={openChatWindow} />
      </div>
    </>
  );
};

export default Chat;
