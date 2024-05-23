import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import { toJS } from 'mobx';
import { useAppContext } from '../../AppContext.js';
import './ChatComponent.css';
import { isArray, isEmpty } from 'lodash';
import Card from './CardViewer/CardViewer.js';

const center = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
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
    return () => handleConversation();
  }, []);

  // Function to handle sending a message
  const handleSendMessage = e => {
    e.preventDefault();
    if (message.trim() !== '') {
      handleConversation(message);
      setMessage('');
    }
  };

  // Convert agent messages to plain JavaScript array
  const data = toJS(agentMessages);

  return (
    <div className={`chat-container ${isChatWindowOpen ? 'open' : ''}`}>
      <div className="chat-head">
        <div style={{ ...center }}>
          <div className="chat-head-title"> Bot {isLoadingChatMessages && 'is typing ...'} </div>
        </div>
        <div style={{ ...center }} className="hover">
          <FiX onClick={_ => closeChatWindow()} />
        </div>
      </div>
      <div className="chat-body">
        <ul className="chat-window" ref={chatWindowRef}>
          {data.map(
            ({ fulfillmentText, userMessage, fulfillmentMessages, webhookPayload }, index) => {
              const suggestedActionValues =
                webhookPayload?.fields?.suggestedActions?.listValue?.values;

              return (
                <li key={index}>
                  {console.log(webhookPayload, suggestedActionValues)}
                  {userMessage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p className={'msgCont'} style={{ opacity: 0 }}>
                        {' '}
                        .{' '}
                      </p>
                      <div className="chat-card" style={{ background: '#77cbfc', color: 'white' }}>
                        <p>{userMessage}</p>
                      </div>
                    </div>
                  )}
                  {fulfillmentText && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="chat-card">
                        <p>{fulfillmentText}</p>
                      </div>
                      <p style={{ opacity: 0 }}> . </p>
                    </div>
                  )}
                  {!isEmpty(fulfillmentMessages) && !fulfillmentText && (
                    <Card data={fulfillmentMessages} />
                  )
                  // fulfillmentMessages.map((data, i) => <Card data={data} index={i} />)
                  }

                  {console.log(
                    666,
                    suggestedActionValues,
                    !isEmpty(suggestedActionValues) &&
                      isArray(suggestedActionValues) &&
                      suggestedActionValues.map(
                        ({ structValue: { fields } }) => fields.label.stringValue
                      )
                  )}

                  {!isEmpty(suggestedActionValues) &&
                    isArray(suggestedActionValues) &&
                    suggestedActionValues.map(({ structValue: { fields } }) =>
                      fields.type.stringValue === 'button' ? (
                        <div className="button-container">
                          <button className={'actionButton'}>{fields.label.stringValue}</button>
                        </div>
                      ) : null
                    )}
                </li>
              );
            }
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
