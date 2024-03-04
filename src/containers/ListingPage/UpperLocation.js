import React from 'react';
import css from './ListingPage.module.css';
function UpperLocation(props) {
  const { publicData, currentListing } = props;
  const { manualAddress, mapLocation, fullManualAddress } = publicData;
  console.log(98, mapLocation, mapLocation?.state);
  const country = manualAddress
    ? fullManualAddress.cityStateCountry
      ? `${fullManualAddress.cityStateCountry}`
      : ''
    : mapLocation?.country
    ? `${mapLocation?.country}`
    : '';
  const state = manualAddress ? null : mapLocation?.state ? `${mapLocation.state},` : '';
  const district = manualAddress ? null : mapLocation?.district ? `${mapLocation.district},` : '';
  const street = manualAddress && fullManualAddress.street ? `${fullManualAddress.street},` : '';
  const zip = manualAddress && fullManualAddress.zip ? `${fullManualAddress.zip}` : '';

  return (
    <div className={css.upperAddress}>
      {manualAddress ? <div>{`${country}`}</div> : <div>{`${district} ${state} ${country}`}</div>}
    </div>
  );
}

export default UpperLocation;
