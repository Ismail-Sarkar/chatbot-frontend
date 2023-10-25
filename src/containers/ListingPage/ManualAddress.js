import React from 'react';
import css from './ListingPage.module.css';

function ManualAddress(props) {
  const { publicData } = props;
  const { fullManualAddress, manualAddress } = publicData;
  const country =
    manualAddress && fullManualAddress.cityStateCountry
      ? `${fullManualAddress.cityStateCountry},`
      : '';
  const street = manualAddress && fullManualAddress.street ? `${fullManualAddress.street},` : '';
  const zip = manualAddress && fullManualAddress.zip ? `${fullManualAddress.zip}` : '';
  return (
    <div className={css.mannualAddressOuter}>
      <div className={css.mannualAddressInner}>
        <div>{`${street}${country}${zip}`}</div>
      </div>
    </div>
  );
}

export default ManualAddress;
