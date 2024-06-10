import React from 'react';
import css from './Avatar.module.css';

const Avatar = ({ letter, avatarWrapper, avatarLetter }) => {
  const avatarWrapeprClass = avatarWrapper || css.avatar;
  const avatarLetterClass = avatarLetter || css.avatarLetter;

  return (
    <div className={avatarWrapeprClass}>
      <span className={avatarLetterClass}>{letter}</span>
    </div>
  );
};

export default Avatar;
