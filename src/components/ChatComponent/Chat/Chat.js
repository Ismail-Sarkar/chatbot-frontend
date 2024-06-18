// Chat.js

import React, { useEffect, useState } from 'react';
import css from './Chat.module.css';
import ChatComponent from '../ChatComponent';
import ChatIcon from '../ChatIcon/ChatIcon';
import { useAppContext } from '../../../AppContext';
import classNames from 'classnames';

const Chat = () => {
  const { openChatWindow, isChatWindowOpen, handleConversation } = useAppContext();

  useEffect(() => {
    handleConversation();
  }, []);

  return (
    <>
      {!isChatWindowOpen && <ChatIcon onClick={openChatWindow} />}
      {isChatWindowOpen && (
        <div className={classNames(css.chatWrapper, { [css.open]: isChatWindowOpen })}>
          <ChatComponent closeChatWindow={openChatWindow} />
        </div>
      )}
    </>
  );
};

export default Chat;
