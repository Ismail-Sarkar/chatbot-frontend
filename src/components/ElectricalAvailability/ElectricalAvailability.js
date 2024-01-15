import React from 'react';
import { Heading } from '../../components';
import css from './ElectricalAvailability.module.css';
import { electricalOutletOption } from '../../config/configListing';

const ElectricalAvailability = ({ publicDataElectric, heading }) => {
  const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M9.51556 9.51664C11.1815 7.85066 11.1815 5.14958 9.51556 3.4836C7.84958 1.81763 5.1485 1.81763 3.48252 3.4836C1.81654 5.14958 1.81654 7.85066 3.48252 9.51664C5.1485 11.1826 7.84958 11.1826 9.51556 9.51664Z"
        fill="black"
      />
    </svg>
  );

  return publicDataElectric ? (
    <div className={css.sectionText}>
      {heading && (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      )}
      <ul className={css.item}>
        {Object.entries(publicDataElectric).map(([key, value]) => {
          const outletOption = electricalOutletOption.find(option => option.key === key);
          if (value && outletOption) {
            return (
              <li key={key} className={css.listItemsIndividual}>
                <span className={css.iconWrapper}>
                  <IconCheck />
                </span>
                <div className={css.labelWrapper}>{outletOption.label}</div>
              </li>
            );
          }
          return null;
        })}
      </ul>
    </div>
  ) : null;
};

export default ElectricalAvailability;
