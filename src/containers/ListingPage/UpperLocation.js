import React from 'react';

function UpperLocation(props) {
  const { publicData, currentListing } = props;
  const { manualAddress, mapLocation, fullManualAddress } = publicData;
  const country = manualAddress
    ? fullManualAddress.cityStateCountry
      ? `${fullManualAddress.cityStateCountry},`
      : ''
    : mapLocation?.country
    ? `${mapLocation?.country}`
    : '';
  const state = manualAddress ? null : mapLocation?.state ? `${mapLocation.state},` : '';
  const district = manualAddress ? null : mapLocation?.district ? `${mapLocation.district},` : '';
  const street = manualAddress && fullManualAddress.street ? `${fullManualAddress.street},` : '';
  const zip = manualAddress && fullManualAddress.zip ? `${fullManualAddress.zip}` : '';

  return (
    <div>
      {manualAddress ? (
        <div>{`${street}${country}${zip}`}</div>
      ) : (
        <div>{`${district}${state}${country}`}</div>
      )}
    </div>
  );
}

export default UpperLocation;
