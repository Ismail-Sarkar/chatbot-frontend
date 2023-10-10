import React from 'react';

function Rules(props) {
  const { publicData } = props;
  const { entryRules } = publicData;
  return (
    <div>
      <div>Rules</div>
      <div>{entryRules}</div>
    </div>
  );
}

export default Rules;
