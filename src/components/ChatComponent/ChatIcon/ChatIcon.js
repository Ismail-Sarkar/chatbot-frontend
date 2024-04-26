// ChatIcon.js

import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import './ChatIcon.css';

const ChatIcon = ({ onClick }) => {
  return (
    <div className="chat-icon" onClick={onClick}>
      <FiMessageSquare />
    </div>
  );
};

export default ChatIcon;
