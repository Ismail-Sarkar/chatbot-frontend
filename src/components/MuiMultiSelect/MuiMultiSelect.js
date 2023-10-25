import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function MuiMultiSelect(props) {
  const { value, setValue, datas, placeholdertext, labeltext, label } = props;

  const [selectedValues, setSelectedValues] = React.useState(value);

  const handleAutocompleteChange = (event, newValue) => {
    setSelectedValues(newValue);
    setValue(newValue);
  };

  const isOptionEqualToValue = (option, value) => {
    return option.key === value.key;
  };

  return (
    <>
      <label>{label}</label>
      <Autocomplete
        multiple
        id="checkboxes-tags-demo"
        options={datas}
        disableCloseOnSelect
        getOptionLabel={option => option.label}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.label}
          </li>
        )}
        style={{ width: 500 }}
        renderInput={params => (
          <TextField {...params} label={labeltext} placeholder={placeholdertext} />
        )}
        value={selectedValues}
        onChange={handleAutocompleteChange} // This is the onChange event handler
        isOptionEqualToValue={isOptionEqualToValue}
      />
    </>
  );
}
