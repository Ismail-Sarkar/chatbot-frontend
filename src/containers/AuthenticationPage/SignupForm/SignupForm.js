import React from 'react';
import { bool, node } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink, H4 } from '../../../components';

import css from './SignupForm.module.css';

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
      } = fieldRenderProps;

      const isPartner =
        typeof window !== 'undefined' && window.location.pathname?.includes('partner');

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'SignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'SignupForm.emailInvalid',
        })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );

      //SignupCode for partners

      const signupCodeRequiredMessage = intl.formatMessage({
        id: 'SignupForm.signupCodeRequired',
      });

      const signupCodeValid = validators.signupCodeValid(
        intl.formatMessage({
          id: 'SignupForm.signupCodeRequired',
        })
      );

      const signupCodeRequired = validators.requiredStringNoTrim(signupCodeRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.middleContainer}>
            {isPartner && (
              <H4 as="h2" className={css.sectionTitle}>
                <FormattedMessage id="SignupForm.partnerSignUp" />
              </H4>
            )}
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={intl.formatMessage({
                id: 'SignupForm.emailLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'SignupForm.emailPlaceholder',
              })}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <div className={css.name}>
              <FieldTextInput
                className={css.firstNameRoot}
                type="text"
                id={formId ? `${formId}.fname` : 'fname'}
                name="fname"
                autoComplete="given-name"
                label={intl.formatMessage({
                  id: 'SignupForm.firstNameLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.firstNamePlaceholder',
                })}
                validate={validators.required(
                  intl.formatMessage({
                    id: 'SignupForm.firstNameRequired',
                  })
                )}
              />
              <FieldTextInput
                className={css.lastNameRoot}
                type="text"
                id={formId ? `${formId}.lname` : 'lname'}
                name="lname"
                autoComplete="family-name"
                label={intl.formatMessage({
                  id: 'SignupForm.lastNameLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.lastNamePlaceholder',
                })}
                validate={validators.required(
                  intl.formatMessage({
                    id: 'SignupForm.lastNameRequired',
                  })
                )}
              />
            </div>
            {isPartner && (
              <>
                <FieldTextInput
                  type="text"
                  id="businessName"
                  name="businessName"
                  className={css.fieldGrp}
                  label={intl.formatMessage({
                    id: 'SignupForm.businessNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.businessNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.businessNameRequired',
                    })
                  )}
                />
                <FieldTextInput
                  className={css.fieldGrp}
                  type="text"
                  id={formId ? `${formId}.businessRole` : 'businessRole'}
                  name="businessRole"
                  autoComplete="businessRole"
                  label={intl.formatMessage({
                    id: 'SignupForm.businessRoleLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.businessRolePlaceholder',
                  })}
                  // validate={validators.composeValidators(emailRequired, emailValid)}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.businessRoleRequired',
                    })
                  )}
                />
              </>
            )}
            <FieldTextInput
              className={css.password}
              type="password"
              id={formId ? `${formId}.password` : 'password'}
              name="password"
              autoComplete="new-password"
              label={intl.formatMessage({
                id: 'SignupForm.passwordLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'SignupForm.passwordPlaceholder',
              })}
              validate={passwordValidators}
            />
            {isPartner && (
              <FieldTextInput
                className={css.fieldGrp}
                type="text"
                id={formId ? `${formId}.signupCode` : 'signupCode'}
                name="signupCode"
                autoComplete="signupCode"
                label={intl.formatMessage({
                  id: 'SignupForm.signupCodeLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.signupCodePlaceholder',
                })}
                validate={validators.composeValidators(signupCodeRequired, signupCodeValid)}
              />
            )}
          </div>
          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
          {isPartner && (
            <div className={css.bottomMessage}>
              Don’t have the partner sign up code? Apply{' '}
              <a href="http://www.adventurely.pro/vendors" target="_blank">
                here
              </a>
            </div>
          )}

          <div className={css.otherTypeSignupLink}>
            {isPartner ? (
              // <NamedLink name="SignupPage" className={css.signupLink}>

              //   <FormattedMessage id="SignupForm.customerSignUp" />

              // </NamedLink>
              <></>
            ) : (
              <div className={css.bottomMessage}>
                Interested in listing your space?
                <br />
                <NamedLink name="PartnerSignupPage" className={css.signupLink}>
                  {/* <FormattedMessage id="SignupForm.partnerSignUp" /> */}
                  Sign up as a partner here
                </NamedLink>
              </div>
            )}
          </div>
        </Form>
      );
    }}
  />
);

SignupFormComponent.defaultProps = { inProgress: false };

SignupFormComponent.propTypes = {
  inProgress: bool,
  termsAndConditions: node.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const SignupForm = compose(injectIntl)(SignupFormComponent);
SignupForm.displayName = 'SignupForm';

export default SignupForm;
