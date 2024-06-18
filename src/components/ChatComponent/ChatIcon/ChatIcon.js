// ChatIcon.js

import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import css from './ChatIcon.module.css';

const ChatIcon = ({ onClick }) => {
  return (
    <>
      <span className={css.chatIcon} onClick={onClick}>
        <FiMessageSquare />
      </span>
    </>
  );
};

export default ChatIcon;
