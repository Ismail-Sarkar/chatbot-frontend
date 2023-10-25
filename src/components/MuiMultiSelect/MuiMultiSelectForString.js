import React, { useState } from 'react';
import MuiMultiSelectComponent from './MuiMultiSelectComponent';

function MuiMultiSelectForString(props) {
  const { value, setValue, datas, placeholdertext, label } = props;

  const [selectedValues, setSelectedValues] = useState(
    value?.map(str => ({ key: str, label: str }))
  );

  const handleSelectedValuesChange = (event, values) => {
    setSelectedValues(values);
    setValue(values.map(str => str.label));
  };

  return (
    <div>
      <label>{label}</label>
      <MuiMultiSelectComponent
        value={selectedValues}
        onChange={handleSelectedValuesChange}
        datas={datas}
        placeholdertext={placeholdertext}
      />
    </div>
  );
}

export default MuiMultiSelectForString;
