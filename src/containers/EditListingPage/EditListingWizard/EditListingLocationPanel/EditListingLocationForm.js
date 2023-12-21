import React, { useState, useEffect } from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../../util/validators';

// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingLocationForm.module.css';
import { useSelector } from 'react-redux';
import { manualAddressChecked } from '../../EditListingPage.duck';
import { isEqual } from 'lodash';
import { createResourceLocatorString } from '../../../../util/routes';
// import { useState } from 'react';

const identity = v => v;

export const EditListingLocationFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        tab,
        form,
        initialValues,
        errors,
      } = formRenderProps;
      // console.log(34, errors);
      // const manualAddressState = useSelector(state => state.EditListingPage.isManualAddressChecked);
      const [manualAddressState, setManualAddressState] = useState(
        initialValues.manualAddress || false
      );
      useEffect(() => {
        setManualAddressState(initialValues?.manualAddress);
      }, [initialValues]);

      const changeCheckBoxValue = (formName, state) => {
        setManualAddressState(state);
        form.change(formName, state);

        form.change('location', {});
      };

      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingLocationForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      // const submitDisabled = (manualAddressState === false && values.location === null)||(manualAddressState&&values.);
      // const submitDisabled =// invalid ||
      // disabled || submitInProgress;
      const handleZipChange = e => {
        const value = e.target.value;

        // Use a regular expression to allow only numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        form.change('zip', numericValue);
      };
      const handlecityStateCountryName = valueFromMap => {
        const { context } = valueFromMap;
        const country = context.find(c => {
          const cId = c.id.split('.')[0];
          return cId === 'country';
        });
        const state = context.find(c => {
          const cId = c.id.split('.')[0];
          return cId === 'region';
        });
        const district = context.find(c => {
          const cId = c.id.split('.')[0];
          return cId === 'district';
        });
        form.change('mapLocation', {
          country: country ? country : null,
          state: state ? state : null,
          district: district ? district : null,
        });
      };

      return (
        <Form
          className={classes}
          onSubmit={e => {
            e.preventDefault();
            props.onSubmit(values);
            // editListingLinkType === 'edit' &&
            //   history.push(
            //     createResourceLocatorString(
            //       'EditListingPage',
            //       routeConfiguration,
            //       {
            //         id,
            //         slug,
            //         type: editListingLinkType,
            //         tab: 'location',
            //       },
            //       {}
            //     )
            //   );
          }}
        >
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.showListingFailed" />
            </p>
          ) : null}

          <FieldLocationAutocompleteInput
            rootClassName={css.locationAddress}
            inputClassName={css.locationAutocompleteInput}
            iconClassName={css.locationAutocompleteInputIcon}
            predictionsClassName={css.predictionsRoot}
            validClassName={css.validLocation}
            autoFocus={autoFocus}
            name="location"
            label={
              manualAddressState
                ? intl.formatMessage(
                    { id: 'EditListingLocationForm.manualAddress' },
                    { optionalText }
                  )
                : intl.formatMessage({
                    id: 'EditListingLocationForm.address',
                  })
            }
            placeholder={
              manualAddressState
                ? intl.formatMessage({
                    id: 'EditListingLocationForm.manualAddressPlaceholder',
                  })
                : intl.formatMessage({
                    id: 'EditListingLocationForm.addressPlaceholder',
                  })
            }
            useDefaultPredictions={false}
            format={identity}
            valueFromForm={values.location}
            validate={composeValidators(
              // autocompleteSearchRequired(addressRequiredMessage),
              autocompletePlaceSelected(addressNotRecognizedMessage)
            )}
            tab={tab}
            changeCheckBoxValue={changeCheckBoxValue}
            manualAddressState={manualAddressState}
            handlecityStateCountryName={handlecityStateCountryName}
          />
          {!manualAddressState && (
            <FieldTextInput
              className={css.building}
              type="text"
              name="building"
              id={`${formId}building`}
              label={intl.formatMessage(
                { id: 'EditListingLocationForm.building' },
                { optionalText }
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingLocationForm.buildingPlaceholder',
              })}
            />
          )}

          {manualAddressState && values?.location?.selectedPlace && (
            <div className={css.AddressWrap}>
              <div className={css.AddressDiv}>
                <span className={css.manualAddress}>
                  Manually enter the address for your remote work day pass*
                </span>
              </div>
              <FieldTextInput
                className={css.building}
                type="text"
                name="street"
                id="street"
                // label="Street Address"
                placeholder="Street"
              />
              <FieldTextInput
                className={css.building}
                type="text"
                name="cityStateCountry"
                id="cityStateCountry"
                // label="City State and Country"
                placeholder="City State and Country"
              />
              <FieldTextInput
                className={css.building}
                type="text"
                name="zip"
                id="zip"
                // label="Zipcode"
                placeholder="Zipcode"
                onChange={handleZipChange}
              />
            </div>
          )}
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            // disabled={values?. ? false : !values?.location?.selectedPlace?.address}
            disabled={
              values?.location?.selectedPlace?.address
                ? !values?.location?.selectedPlace?.address
                : values?.manualAddress
                ? isEqual(
                    {
                      street: values.street,
                      cityStateCountry: values.cityStateCountry,
                      zip: values.zip,
                    },
                    {
                      street: initialValues.street,
                      cityStateCountry: initialValues.cityStateCountry,
                      zip: initialValues.zip,
                    }
                  )
                : true
            }
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingLocationFormComponent.defaultProps = {
  selectedPlace: null,
  fetchErrors: null,
  formId: 'EditListingLocationForm',
};

EditListingLocationFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  selectedPlace: propTypes.place,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingLocationFormComponent);
