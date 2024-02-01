import moment from 'moment';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../Button/Button';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import axios from 'axios';
import { apiBaseUrl } from '../../util/api';
import css from './ManageSubscriptionComponent.module.css';

function ManageSubscriptionComponent() {
  const currentUser = useSelector(state => state.user.currentUser);
  const [unsubscribeInProgress, setUnsubscribeInProgress] = useState(false);

  const handleUnsubscribe = () => {
    setUnsubscribeInProgress(true);
    const dataToUnsubscribe = {
      subId: currentUser?.attributes?.profile?.protectedData?.subscriptionId,
      userId: currentUser.id.uuid,
    };
    axios
      .post(`${apiBaseUrl()}/api/unsubscribeSubscriptionofUser`, dataToUnsubscribe)
      .then(res => setUnsubscribeInProgress(false))
      .catch(err => setUnsubscribeInProgress(false));
  };
  return (
    <div>
      <p>
        {currentUser?.attributes?.profile?.protectedData?.subscriptionStatus === 'active'
          ? 'You have an active subscription as a partner'
          : `You don't have any active subscription yet`}
      </p>
      <p>
        {currentUser?.attributes?.profile?.protectedData?.subscriptionDetails
          ? moment(new Date()).isSameOrBefore(
              moment(
                new Date(
                  currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                )
              )
            ) && !currentUser?.attributes?.profile?.protectedData?.isSubscriptionCancelled
            ? `Your current subscription will automatically renew on ${moment(
                new Date(
                  currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                )
              ).format('MMM DD, YYYY')}`
            : moment(new Date()).isSameOrBefore(
                moment(
                  new Date(
                    currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                  )
                )
              )
            ? `Your current subscription will expire on ${moment(
                new Date(
                  currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                )
              ).format('MMM DD, YYYY')}`
            : `Your current subscription expired at ${moment(
                new Date(
                  currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                )
              ).format('MMM DD, YYYY')}`
          : null}
      </p>
      {currentUser?.attributes?.profile?.protectedData?.subscriptionStatus === 'active' && (
        <Button
          type="button"
          inProgress={unsubscribeInProgress}
          disabled={unsubscribeInProgress}
          onClick={handleUnsubscribe}
          className={css.unsubscribeBtn}
        >
          <FormattedMessage id="ManageSubscriptionPage.unsubscribe" />
        </Button>
      )}
    </div>
  );
}

export default compose(injectIntl)(ManageSubscriptionComponent);
