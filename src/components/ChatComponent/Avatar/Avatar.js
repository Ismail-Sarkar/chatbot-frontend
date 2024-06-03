import React from 'react';
import css from './Avatar.module.css';

const Avatar = ({ letter }) => {
  return (
    <div className={css.avatar}>
      <span className={css.avatarLetter}>{letter}</span>
    </div>
  );
};

export default Avatar;
