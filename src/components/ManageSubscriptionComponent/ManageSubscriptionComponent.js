import moment from 'moment';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../Button/Button';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import axios from 'axios';
import { apiBaseUrl } from '../../util/api';
import css from './ManageSubscriptionComponent.module.css';
import { fetchCurrentUser } from '../../ducks/user.duck';

function ManageSubscriptionComponent() {
  const currentUser = useSelector(state => state.user.currentUser);
  const dispatch = useDispatch();
  const [subscriptionProcessInProgress, setSubscriptionProcessInProgress] = useState(false);

  const isStripeSubscribed =
    typeof currentUser?.attributes.profile.protectedData.subscriptionDetails !== 'undefined'
      ? currentUser?.attributes.profile.protectedData.subscriptionStatus === 'active' ||
        (currentUser?.attributes.profile.protectedData.isSubscriptionCancelled &&
          (moment(new Date()).isBetween(
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionStart,
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionEnd,
            'day'
          ) ||
            moment(new Date()).isSame(
              currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionStart,
              'day'
            ) ||
            moment(new Date()).isSame(
              currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionEnd,
              'day'
            )))
      : false;
  const canSubscribe =
    typeof currentUser?.attributes.profile.protectedData.subscriptionDetails !== 'undefined'
      ? (currentUser?.attributes.profile.protectedData.subscriptionStatus !== 'active' ||
          !currentUser?.attributes.profile.protectedData.isSubscriptionCancelled) &&
        !(
          moment(new Date()).isBetween(
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionStart,
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionEnd,
            'day'
          ) ||
          moment(new Date()).isSame(
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionStart,
            'day'
          ) ||
          moment(new Date()).isSame(
            currentUser?.attributes.profile.protectedData.subscriptionDetails.subscriptionEnd,
            'day'
          )
        )
      : true;

  const handleUnsubscribe = () => {
    setSubscriptionProcessInProgress(true);
    const dataToUnsubscribe = {
      subsId: currentUser?.attributes?.profile?.protectedData?.subscriptionId,
      userId: currentUser.id.uuid,
    };
    axios
      .post(`${apiBaseUrl()}/api/unsubscribeSubscriptionofUser`, dataToUnsubscribe)
      .then(res => {
        dispatch(fetchCurrentUser());
        setSubscriptionProcessInProgress(false);
      })
      .catch(err => setSubscriptionProcessInProgress(false));
  };

  const handleSubscribe = () => {
    if (currentUser && canSubscribe && process.env.REACT_APP_ENV === 'development') {
      setSubscriptionProcessInProgress(true);
      const stripeSubscriptionUrl = `https://buy.stripe.com/test_5kA3gg8iQ57A0WA000?client_reference_id=${currentUser?.id?.uuid}`;
      // const stripeSubscriptionUrl = `https://buy.stripe.com/test_7sI1882Yw0Rk8p24gh?client_reference_id=${currentUser?.id?.uuid}`;
      window.location.href = stripeSubscriptionUrl;
    }
  };

  return (
    <div>
      <p>
        {isStripeSubscribed
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
            : `Your subscription expired on ${moment(
                new Date(
                  currentUser?.attributes?.profile?.protectedData?.subscriptionDetails?.subscriptionEnd
                )
              ).format('MMM DD, YYYY')}`
          : null}
      </p>
      {currentUser?.attributes?.profile?.protectedData?.subscriptionStatus === 'active' && (
        <Button
          type="button"
          inProgress={subscriptionProcessInProgress}
          disabled={subscriptionProcessInProgress}
          onClick={handleUnsubscribe}
          className={css.unsubscribeBtn}
        >
          <FormattedMessage id="ManageSubscriptionPage.unsubscribe" />
        </Button>
      )}
      {canSubscribe && (
        <Button
          type="button"
          inProgress={subscriptionProcessInProgress}
          disabled={subscriptionProcessInProgress}
          className={css.unsubscribeBtn}
          onClick={handleSubscribe}

          // ready={ready}
          // updated={panelUpdated}
          // updateInProgress={updateInProgress}
        >
          Subscribe
        </Button>
      )}
    </div>
  );
}

export default compose(injectIntl)(ManageSubscriptionComponent);
