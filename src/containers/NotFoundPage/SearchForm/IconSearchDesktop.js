import React from 'react';

import css from './SearchForm.module.css';

const IconSearchDesktop = () => (
  <svg
    className={css.iconSvg}
    width="25"
    height="25"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      className={css.iconSvgGroup}
      transform="matrix(-1 0 0 1 20 1)"
      strokeWidth="2"
      fill="none"
      fillRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 14l5.241 5.241" />
      <circle cx="7.5" cy="7.5" r="7.5" />
    </g>
  </svg>
);

export default IconSearchDesktop;
