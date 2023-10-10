import React from 'react';

function ManualAddress(props) {
  const { publicData } = props;
  const { fullManualAddress } = publicData;
  const cityStateCountry = fullManualAddress?.state ? fullManualAddress?.state : '';
  return (
    <div>
      <div>Manual Address</div>
      {fullManualAddress?.cityStateCountry && (
        <div>{`City state country : ${fullManualAddress?.cityStateCountry}`}</div>
      )}
      {fullManualAddress?.street && <div>{`Street : ${fullManualAddress?.street}`}</div>}
      {fullManualAddress?.zip && <div>{`Zip : ${fullManualAddress?.zip}`}</div>}
    </div>
  );
}

export default ManualAddress;
