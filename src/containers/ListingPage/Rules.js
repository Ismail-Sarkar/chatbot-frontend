import React from 'react';
import css from './ListingPage.module.css';
function Rules(props) {
  const { publicData } = props;
  const { rulesValOption, entryRules } = publicData;
  return (
    <div className={css.RulesDiv}>
      <div className={css.rulesHead}>Rules</div>
      {rulesValOption.headphoneMust && (
        <li>
          Headphones must be used for streaming music/audio from your phone or laptop while using
          your pass
        </li>
      )}
      {rulesValOption.noPhoneLaptopWorkCalls && (
        <li>No phone or laptop work calls permitted while using your pass</li>
      )}
      {rulesValOption.other && <li>Other</li>}

      {rulesValOption.other && entryRules && <div>{entryRules}</div>}
    </div>
  );
}

export default Rules;
