import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import { toJS } from 'mobx';
import { useAppContext } from '../../AppContext.js';
import { isArray, isEmpty } from 'lodash';
import Card from './CardViewer/CardViewer.js';
import Avatar from './Avatar/Avatar.js';
import classNames from 'classnames';

import css from './ChatComponent.module.css';

const center = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const getStringValue = val => val.stringValue;

const getActionData = fields => {
  const label = getStringValue(fields.label);
  const actionText = getStringValue(fields.actionText);
  const type = getStringValue(fields.type);

  return { label, actionText, type };
};

const ChatComponent = props => {
  const {
    closeChatWindow,
    isChatWindowOpen,
    handleConversation,
    agentMessages,
    isLoadingChatMessages,
  } = useAppContext();

  const [message, setMessage] = useState('');
  const chatWindowRef = useRef(null);

  const [letter, setLetter] = useState('B');

  const [botName, setBotName] = useState('Bitcanny AI Support');

  // Function to scroll to the bottom of the chat window
  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when agent messages change
  useLayoutEffect(() => {
    scrollToBottom();
  }, [agentMessages]);

  // Send initial conversation message when component mounts
  useEffect(() => {
    handleConversation();
    // return () => handleConversation();
  }, []);

  // Function to handle sending a message
  const handleSendMessage = e => {
    e.preventDefault();
    if (message.trim() !== '') {
      handleConversation(message);
      setMessage('');
    }
  };

  const handleActionButtonClick = action => {
    if (action && typeof action === 'string' && action.trim() !== '') {
      handleConversation(action);
      setMessage('');
    }
  };

  // Convert agent messages to plain JavaScript array
  const data = toJS(agentMessages);

  return (
    <div className={classNames(css.chatContainer, isChatWindowOpen && css.open)}>
      <div className={css.chatHead}>
        <div style={{ ...center }}>
          <Avatar
            letter={letter}
            avatarWrapper={css.avatarWrapper}
            avatarLetter={css.avatarLetter}
          />
          <div className={css.chatHeadTitle}>
            {botName} {isLoadingChatMessages && 'is typing ...'}{' '}
          </div>
        </div>
        <div style={{ ...center }} className={css.hover}>
          <FiX onClick={_ => closeChatWindow()} size={'30'} />
        </div>
      </div>
      <div className={css.chatBody}>
        <ul className={css.chatWindow} ref={chatWindowRef}>
          <div className={css.avatarContainer}>
            <div className={css.avatarContainer}>
              <Avatar letter={letter} />
            </div>
            <div className={css.text}>
              <div className={css.botTitle}>Bitcanny AI Support</div>
              <div className={css.botSubTitle}>Ready to help!</div>
            </div>
          </div>
          {data.map(
            ({ fulfillmentText, userMessage, fulfillmentMessages, webhookPayload }, index) => {
              const suggestedActionValues =
                webhookPayload?.fields?.suggestedActions?.listValue?.values;

              return (
                <li key={index}>
                  {userMessage && (
                    <div style={{ display: 'flex', justifyContent: 'end' }}>
                      <div className={classNames(css.chatCard, css.userMessage)}>
                        <div className={css.userMsg}>{userMessage}</div>
                      </div>
                    </div>
                  )}
                  {fulfillmentText && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className={css.chatCard}>
                        {/* <p>{fulfillmentText}</p> */}
                        <div className={css.botReply}>{fulfillmentText}</div>
                      </div>
                    </div>
                  )}
                  {!isEmpty(fulfillmentMessages) && !fulfillmentText && (
                    <Card data={fulfillmentMessages} />
                  )
                  // fulfillmentMessages.map((data, i) => <Card data={data} index={i} />)
                  }

                  {!isEmpty(suggestedActionValues) &&
                    isArray(suggestedActionValues) &&
                    suggestedActionValues.map(({ structValue: { fields } }) => {
                      const { label, type, actionText } = getActionData(fields) || {};
                      return type === 'button' ? (
                        <div className={css.buttonContainer}>
                          <button
                            className={css.actionButton}
                            onClick={() => handleActionButtonClick(actionText)}
                          >
                            {label}
                          </button>
                        </div>
                      ) : null;
                    })}
                </li>
              );
            }
          )}
          {isLoadingChatMessages && (
            <div className={css.typingIndicator}>
              <span className={css.dot}></span>
              <span className={css.dot}></span>
              <span className={css.dot}></span>
            </div>
          )}
        </ul>
        <hr style={{ background: '#fff' }} />
        <form onSubmit={handleSendMessage} className={css.inputContainer}>
          <input
            className={css.input}
            type="text"
            onChange={e => setMessage(e.target.value)}
            value={message}
            placeholder="Begin a conversation with our agent"
          />
          <div className={css.sendBtnCtn}>
            <div className={css.hover} onClick={handleSendMessage}>
              <FiSend style={{ transform: 'rotate(50deg)' }} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
