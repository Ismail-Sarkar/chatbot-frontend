import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import { toJS } from 'mobx';
import { useAppContext } from '../../AppContext.js';
import './ChatComponent.css';
import { isArray, isEmpty } from 'lodash';
import Card from './CardViewer/CardViewer.js';
import Avatar from './Avatar/Avatar.js';
import classNames from 'classnames';

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
    <div className={`chat-container ${isChatWindowOpen ? 'open' : ''}`}>
      <div className="chat-head">
        <div style={{ ...center }}>
          <div className="chat-head-title">
            {' '}
            {botName} {isLoadingChatMessages && 'is typing ...'}{' '}
          </div>
        </div>
        <div style={{ ...center }} className="hover">
          <FiX onClick={_ => closeChatWindow()} />
        </div>
      </div>
      <div className="chat-body">
        <ul className="chat-window" ref={chatWindowRef}>
          <div className="avatarContainer">
            <Avatar letter={letter} />
            <div className="text">
              <div className="botTitle">Bitcanny AI Support</div>
              <div className="botSubTitle">Ready to help!</div>
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
                      <div className={classNames('chat-card', 'userMessage')}>
                        <div className="userMsg">{userMessage}</div>
                      </div>
                    </div>
                  )}
                  {fulfillmentText && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="chat-card">
                        {/* <p>{fulfillmentText}</p> */}
                        <div className="botReply">{fulfillmentText}</div>
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
                        <div className="button-container">
                          <button
                            className={'actionButton'}
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
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
        </ul>
        <hr style={{ background: '#fff' }} />
        <form onSubmit={handleSendMessage} className="input-container">
          <input
            className="input"
            type="text"
            onChange={e => setMessage(e.target.value)}
            value={message}
            placeholder="Begin a conversation with our agent"
          />
          <div className="send-btn-ctn">
            <div className="hover" onClick={handleSendMessage}>
              <FiSend style={{ transform: 'rotate(50deg)' }} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
