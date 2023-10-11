import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import css from './MuiMultiSelect.module.css';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function MuiMultiSelectComponent({
  value,
  onChange,
  datas,
  placeholdertext,
  labeltext,
}) {
  const isOptionEqualToValue = (option, value) => {
    return option.key === value.key;
  };

  return (
    <Autocomplete
      className={css.muiMultiSelectRoot}
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
      value={value}
      onChange={onChange}
      renderInput={params => (
        <TextField {...params} label={labeltext} placeholder={placeholdertext} />
      )}
      isOptionEqualToValue={isOptionEqualToValue}
    />
  );
}
