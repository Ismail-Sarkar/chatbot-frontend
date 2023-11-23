import React from 'react';
import css from './ListingPage.module.css';
function Rules(props) {
  const { publicData } = props;
  const { rulesValOption, entryRules } = publicData;
  const editedEntryRules =
    entryRules &&
    entryRules
      .toString()
      .replaceAll('\n', '')
      .replaceAll('＜', '<')
      .replaceAll('＞', '>');
  return (
    <div className={css.RulesDiv}>
      <div className={css.rulesHead}>Rules</div>
      {rulesValOption.headphoneMust && (
        <li className={css.listStyle}>
          Headphones must be used for streaming music/audio from your phone or laptop while using
          your pass.
        </li>
      )}
      {rulesValOption.noPhoneLaptopWorkCalls && (
        <li className={css.listStyle}>
          No phone or laptop work calls permitted while using your pass.
        </li>
      )}
      {rulesValOption.other && null}

      {rulesValOption.other && entryRules && (
        <div dangerouslySetInnerHTML={{ __html: editedEntryRules }} />
      )}
    </div>
  );
}

export default Rules;
