import React, { useEffect } from 'react';
import { H3, LayoutSingleColumn, NamedLink, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { types as sdkTypes } from '../../util/sdkLoader';
import AdventurelyLogo from '../../assets/adventurely_image.jpg';
import css from './StripeSubscriptionSuccessPanel.module.css';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { formatMoney } from '../../util/currency';
import { useSelector } from 'react-redux';
import moment from 'moment';

function StripeSubscriptionSuccessPanel(props) {
  const { intl } = props;
  const history = useHistory();
  const title = intl.formatMessage({ id: 'StripeSubscriptionSuccessPanel.title' });
  const scrollingDisabled = () => {};

  const currentUser = useSelector(state => state.user.currentUser);

  const location = useLocation();
  const searchParams = new URLSearchParams(location?.search);

  let stripeSubcriptionStatusFromUrl = searchParams?.get('success');

  useEffect(() => {
    if (currentUser) {
      const isSubscribed =
        typeof currentUser.attributes.profile.privateData.subscriptionDetails !== 'undefined' &&
        currentUser.attributes.profile.publicData.userType === 'partner'
          ? currentUser.attributes.profile.privateData.subscriptionDetails.subscriptionStatus ===
              'active' &&
            (moment(new Date()).isBetween(
              currentUser.attributes.profile.privateData.subscriptionDetails.subscriptionStart,
              currentUser.attributes.profile.privateData.subscriptionDetails.subscriptionEnd,
              'day'
            ) ||
              moment(new Date()).isSame(
                currentUser.attributes.profile.privateData.subscriptionDetails.subscriptionStart,
                'day'
              ) ||
              moment(new Date()).isSame(
                currentUser.attributes.profile.privateData.subscriptionDetails.subscriptionEnd,
                'day'
              ))
          : false;
      if (
        !stripeSubcriptionStatusFromUrl ||
        typeof stripeSubcriptionStatusFromUrl === 'undefined' ||
        !isSubscribed
      ) {
        history.push('/');
      }
    }
  }, [stripeSubcriptionStatusFromUrl, currentUser]);

  const { Money } = sdkTypes;

  const SUBSCRIPTION_TOTAL_AMOUNT = 7200;
  const CURRENCY = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;
  return (
    <Page
      className={css.root}
      title={title}
      // scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="ProfileSettingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.successPageRoot}>
          <div className={css.successContainerLeft}>
            <H3 as="h1" className={css.Title}>
              <p>
                <FormattedMessage
                  id="StripeSubscriptionSuccessPanel.title"
                  values={{ lineBreak: <br /> }}
                />
              </p>
            </H3>
            <p>
              <FormattedMessage
                id="StripeSubscriptionSuccessPanel.subscribedtitle"
                values={{ lineBreak: <br /> }}
              />
            </p>
            <p>
              Fill out your{' '}
              <NamedLink className={css.links} name="ProfileSettingsPage">
                <span>business profile</span>
              </NamedLink>{' '}
              & create your first listing{' '}
              <NamedLink className={css.links} name="NewListingPage">
                <span>here</span>
              </NamedLink>
              .
            </p>
          </div>
          <div className={css.successContainerRight}>
            <div className={css.logoContainer}>
              <img src={AdventurelyLogo} alt="AdventurelyLogo"></img>
            </div>
            <div className={css.successPriceContainer}>
              <div className={css.priceTotalTitle}>Total Price:</div>
              <div className={css.priceTotalAmount}>
                {formatMoney(intl, new Money(SUBSCRIPTION_TOTAL_AMOUNT, CURRENCY))} {CURRENCY}
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>{' '}
    </Page>
  );
}

export default compose(injectIntl)(StripeSubscriptionSuccessPanel);
