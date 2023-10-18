import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './ValidationError.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { manualAddressChecked } from '../../containers/EditListingPage/EditListingPage.duck';

/**
 * This component can be used to show validation errors next to form
 * input fields. The component takes the final-form Field component
 * `meta` object as a prop and infers if an error message should be
 * shown.
 */
const ValidationError = props => {
  const {
    rootClassName,
    className,
    fieldMeta,
    tab,
    changeCheckBoxValue,
    manualAddressState,
  } = props;
  const { touched, error } = fieldMeta;
  const classes = classNames(rootClassName || css.root, className);
  const dispatch = useDispatch();
  const manualAddressCheck = e => {
    const isChecked = e.target.checked;
    // dispatch(manualAddressChecked(isChecked));
    changeCheckBoxValue('manualAddress', isChecked);
  };
  return touched && error ? (
    tab === 'location' ? (
      <div className={css.mannualAddressCheckbox}>
        <span className={classes}>{error}</span>
        <input
          type="checkbox"
          id="manualAddress"
          name="manualAddress"
          onChange={manualAddressCheck}
          checked={manualAddressState}
          // value={f}
          // defaultChecked={defaultCheck(f)}
          // disabled={defaultDisabled(f)}
        />
      </div>
    ) : (
      <div className={classes}>{error}</div>
    )
  ) : null;
};

ValidationError.defaultProps = { rootClassName: null, className: null };

const { shape, bool, string } = PropTypes;

ValidationError.propTypes = {
  rootClassName: string,
  className: string,
  fieldMeta: shape({
    touched: bool.isRequired,
    error: string,
  }).isRequired,
};

export default ValidationError;
