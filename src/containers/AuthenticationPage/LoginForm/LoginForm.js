import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink, H4 } from '../../../components';

import css from './LoginForm.module.css';
import axios from 'axios';
import { apiBaseUrl } from '../../../util/api';

const LoginFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        intl,
        invalid,
        isPartner,
        values,
      } = fieldRenderProps;

      // email
      const emailLabel = intl.formatMessage({
        id: 'LoginForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'LoginForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'LoginForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'LoginForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      // password
      const passwordLabel = intl.formatMessage({
        id: 'LoginForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'LoginForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'LoginForm.passwordRequired',
      });
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const passwordRecoveryLink = (
        <NamedLink name="PasswordRecoveryPage" className={css.recoveryLink}>
          <FormattedMessage id="LoginForm.forgotPassword" />
        </NamedLink>
      );

      const [loginTypeError, setLoginTypeError] = useState(null);
      const [loginInProgress, setLoginInProgress] = useState(false);

      return (
        <Form
          className={classes}
          onSubmit={e => {
            setLoginInProgress(true);
            e.preventDefault();
            setLoginTypeError(null);
            axios
              .get(`${apiBaseUrl()}/api/getUserType/${values.email}`)
              .then(resp => {
                setLoginInProgress(false);
                if (resp.data.data.userType === 'partner' && !isPartner) {
                  return setLoginTypeError('Please use the Partner login.');
                } else if (resp.data.data.userType === 'customer' && isPartner) {
                  return setLoginTypeError('Partner account not found');
                } else {
                  handleSubmit();
                }
              })
              .catch(err => {
                setLoginInProgress(false);
                setLoginTypeError(null);
                handleSubmit();
              });
          }}
        >
          {isPartner && (
            <H4 as="h2" className={css.sectionTitle}>
              <FormattedMessage id="LoginForm.partnerLogIn" />
            </H4>
          )}
          <div className={css.LoginMiddleContainer}>
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={emailLabel}
              placeholder={emailPlaceholder}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <FieldTextInput
              className={css.password}
              type="password"
              id={formId ? `${formId}.password` : 'password'}
              name="password"
              autoComplete="current-password"
              label={passwordLabel}
              placeholder={passwordPlaceholder}
              validate={passwordRequired}
            />
          </div>
          <div className={css.bottomWrapper}>
            <p className={css.bottomWrapperText}>
              <span className={css.recoveryLinkInfo}>
                <FormattedMessage
                  id="LoginForm.forgotPasswordInfo"
                  values={{ passwordRecoveryLink }}
                />
              </span>
            </p>

            {loginTypeError && <div className={css.errMsg}>{loginTypeError}</div>}
            <PrimaryButton
              type="submit"
              inProgress={submitInProgress || loginInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="LoginForm.logIn" />
            </PrimaryButton>
          </div>

          <div className={css.otherTypeLoginLink}>
            {!isPartner ? (
              <NamedLink
                name="PartnerLoginPage"
                className={classNames(css.signupLink, css.redLink)}
              >
                {/* <span className={css.signup}> */}
                <FormattedMessage id="LoginForm.partnerLogIn" />
                {/* </span> */}
              </NamedLink>
            ) : (
              <NamedLink name="PartnerSignupPage" className={css.signupLink}>
                <FormattedMessage id="SignupForm.partnerSignUp" />
              </NamedLink>
            )}
          </div>
        </Form>
      );
    }}
  />
);

LoginFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  form: null,
  inProgress: false,
};

const { string, bool } = PropTypes;

LoginFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  form: string,
  inProgress: bool,
  intl: intlShape.isRequired,
};

const LoginForm = compose(injectIntl)(LoginFormComponent);
LoginForm.displayName = 'LoginForm';

export default LoginForm;
