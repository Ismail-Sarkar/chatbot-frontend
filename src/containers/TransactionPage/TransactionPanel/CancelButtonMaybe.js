import React from 'react';
import classNames from 'classnames';

import css from './TransactionPanel.module.css';
import moment from 'moment';
import { SecondaryButton } from '../../../components';
import { FormattedMessage } from 'react-intl';

// Functional component as a helper to build ActionButtons for
// provider when state is preauthorized
const CancelButtonMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    cancelInProgress,
    cancelBookingError,
    isProvider,
    onCancelBookingCustomer,
    onCancelBookingProvider,
  } = props;

  const buttonsDisabled = cancelInProgress;

  const cancelBookingErrorMessage = cancelBookingError ? (
    <p className={css.actionError}>
      <FormattedMessage id="TransactionPanel.cancelBookingFailed" />
    </p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>{cancelBookingErrorMessage}</div>
      <div className={css.actionButtonWrapper}>
        <SecondaryButton
          inProgress={cancelInProgress}
          disabled={buttonsDisabled}
          onClick={isProvider ? onCancelBookingProvider : onCancelBookingCustomer}
          className={css.secondaryBtn}
        >
          <FormattedMessage id="TransactionPanel.cancelButton" />
        </SecondaryButton>
      </div>
    </div>
  ) : null;
};

export default CancelButtonMaybe;
