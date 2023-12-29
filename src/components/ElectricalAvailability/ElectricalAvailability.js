import React from 'react';
import { Heading } from '../../components';

import css from './ElectricalAvailability.module.css';
import classNames from 'classnames';

const ElectricalAvailability = props => {
  const { publicDataElectric, heading } = props;

  const IconCheck = props => {
    const isVisible = props.isVisible;
    const classes = isVisible ? css.checkIcon : classNames(css.checkIcon, css.hidden);

    return (
      //   <svg width="9" height="9" xmlns="http://www.w3.org/2000/svg" className={classes}>
      //     <path
      //       className={css.marketplaceFill}
      //       d="M2.636621 7.7824771L.3573694 5.6447948c-.4764924-.4739011-.4764924-1.2418639 0-1.7181952.4777142-.473901 1.251098-.473901 1.7288122 0l1.260291 1.1254783L6.1721653.505847C6.565577-.0373166 7.326743-.1636902 7.8777637.227582c.5473554.3912721.6731983 1.150729.2797866 1.6951076L4.4924979 7.631801c-.2199195.306213-.5803433.5067096-.9920816.5067096-.3225487 0-.6328797-.1263736-.8637952-.3560334z"
      //       fillRule="evenodd"
      //     />
      //   </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
      >
        <path
          d="M9.51556 9.51664C11.1815 7.85066 11.1815 5.14958 9.51556 3.4836C7.84958 1.81763 5.1485 1.81763 3.48252 3.4836C1.81654 5.14958 1.81654 7.85066 3.48252 9.51664C5.1485 11.1826 7.84958 11.1826 9.51556 9.51664Z"
          fill="black"
        />
      </svg>
    );
  };

  return publicDataElectric ? (
    <div className={css.sectionText}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}
      <li className={css.item}>
        {publicDataElectric.noOutletsAvailable ? (
          <div className={css.listItemsIndividual}>
            <span className={css.iconWrapper}>
              <IconCheck isVisible={true} />
            </span>
            <div className={css.labelWrapper}>
              No outlets available - arrive with your laptop/phone charged
            </div>
          </div>
        ) : null}
        {publicDataElectric.severalOutletsAvailable ? (
          <div className={css.listItemsIndividual}>
            <span className={css.iconWrapper}>
              <IconCheck isVisible={true} />
            </span>
            <div className={css.labelWrapper}>
              A small amount of outlets available - arrive with your laptop/phone charged
            </div>
          </div>
        ) : null}
        {publicDataElectric.smallAmountOfOutletAvailable ? (
          <div className={css.listItemsIndividual}>
            <span className={css.iconWrapper}>
              <IconCheck isVisible={true} />
            </span>
            <div className={css.labelWrapper}>
              Several outlets are available - you can charge your laptop/phone
            </div>
          </div>
        ) : null}
      </li>
    </div>
  ) : null;
};

export default ElectricalAvailability;
