import React, { useRef, useState } from 'react';
import { MdCopyAll } from 'react-icons/md';

import css from './CopyText.module.css';
import ExternalLink from '../ExternalLink/ExternalLink';

const CopyText = ({ text }) => {
  const textRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyClick = () => {
    const range = document.createRange();
    range.selectNode(textRef.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    // Execute the copy command
    document.execCommand('copy');

    // Deselect the text
    window.getSelection().removeAllRanges();
    setCopySuccess(true);
  };

  return (
    <div>
      <div>
        {/* Text to be copied */}
        <ExternalLink href={text}>
          <span ref={textRef}>{text}</span>
        </ExternalLink>
        {/* Copy icon with click event */}
        <MdCopyAll onClick={handleCopyClick} size={'25px'} className={css.icon} />
      </div>
      {copySuccess && <span className={css.copySuccess}>Link copied to clipboard</span>}
    </div>
  );
};

export default CopyText;
