import React from 'react';
import css from './ListingPage.module.css';
function Rules(props) {
  const { publicData } = props;
  const { entryRules } = publicData;
  return (
    <div className={css.RulesDiv}>
      <div className={css.rulesHead}>Rules</div>
      <div>{entryRules}</div>
    </div>
  );
}

export default Rules;
