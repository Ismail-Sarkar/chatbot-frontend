import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { isTransactionsTransitionAlreadyReviewed } from '../../../util/errors';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldReviewRating, Form, PrimaryButton, FieldTextInput } from '../../../components';

import css from './ReviewForm.module.css';
import moment from 'moment';

const ReviewFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        intl,
        formId,
        invalid,
        reviewSent,
        sendReviewError,
        sendReviewInProgress,
        provider,
      } = fieldRenderProps;
      const providerCreationDate = provider && moment(provider?.attributes.createdAt);
      const today = moment();

      const reviewRating = intl.formatMessage({ id: 'ReviewForm.reviewRatingLabel' });
      const reviewRatingRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewRatingRequired',
      });

      const reviewContent = intl.formatMessage({ id: 'ReviewForm.reviewContentLabel' });
      const reviewContentPlaceholderMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentPlaceholder',
      });
      const reviewContentRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentRequired',
      });

      const errorMessage = isTransactionsTransitionAlreadyReviewed(sendReviewError) ? (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitAlreadySent" />
        </p>
      ) : (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitFailed" />
        </p>
      );
      const errorArea = sendReviewError ? errorMessage : <p className={css.errorPlaceholder} />;

      const reviewSubmitMessage = intl.formatMessage({
        id: 'ReviewForm.reviewSubmit',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = sendReviewInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldReviewRating
            className={css.reviewRating}
            id={formId ? `${formId}.starRating` : 'starRating'}
            name="reviewRating"
            label={reviewRating}
            validate={required(reviewRatingRequiredMessage)}
          />
          {provider &&
          // today.isBetween(
          //   provider.attributes.profile.publicData?.subScriptionOn?.subscriptionStart,
          //   provider.attributes.profile.publicData?.subScriptionOn?.subscriptionEnd
          //   )
          today.diff(providerCreationDate, 'years') <= 1 ? null : (
            <FieldTextInput
              className={css.reviewContent}
              type="textarea"
              id={formId ? `${formId}.reviewContent` : 'reviewContent'}
              name="reviewContent"
              label={reviewContent}
              placeholder={reviewContentPlaceholderMessage}
              validate={required(reviewContentRequiredMessage)}
            />
          )}

          {errorArea}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={reviewSent}
          >
            {reviewSubmitMessage}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

ReviewFormComponent.defaultProps = { className: null, rootClassName: null, sendReviewError: null };

const { bool, func, string } = PropTypes;

ReviewFormComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  reviewSent: bool.isRequired,
  sendReviewError: propTypes.error,
  sendReviewInProgress: bool.isRequired,
};

const ReviewForm = compose(injectIntl)(ReviewFormComponent);
ReviewForm.displayName = 'ReviewForm';

export default ReviewForm;
