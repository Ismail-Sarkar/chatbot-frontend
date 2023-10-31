import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink, H4 } from '../../../components';

import css from './LoginForm.module.css';

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
      } = fieldRenderProps;

      const isPartner =
        typeof window !== 'undefined' && window.location.pathname?.includes('partner');

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

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {isPartner && (
            <H4 as="h2" className={css.sectionTitle}>
              <FormattedMessage id="LoginForm.partnerLogIn" />
            </H4>
          )}
          <div>
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
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="LoginForm.logIn" />
            </PrimaryButton>
          </div>

          <div className={css.otherTypeLoginLink}>
            {isPartner ? (
              <NamedLink name="LoginPage" className={css.signupLink}>
                {/* <span className={css.signup}> */}
                <FormattedMessage id="LoginForm.customerLogIn" />
                {/* </span> */}
              </NamedLink>
            ) : (
              <NamedLink name="PartnerLoginPage" className={css.signupLink}>
                {/* <span className={css.signup}> */}
                <FormattedMessage id="LoginForm.partnerLogIn" />
                {/* </span> */}
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
