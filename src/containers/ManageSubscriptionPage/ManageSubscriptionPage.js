import React, { useState } from 'react';
import {
  H3,
  LayoutSideNavigation,
  LayoutWrapperAccountSettingsSideNav,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  Page,
  UserNav,
} from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ManageSubscriptionPage.module.css';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ManageSubscriptionComponent from '../../components/ManageSubscriptionComponent/ManageSubscriptionComponent';
// import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

function ManageSubscriptionPage(props) {
  const { scrollingDisabled, intl } = props;

  const title = intl.formatMessage({ id: 'ManageSubscriptionPage.title' });

  return (
    <div>
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation
          topbar={
            <>
              <TopbarContainer
                currentPage="ContactDetailsPage"
                desktopClassName={css.desktopTopbar}
                mobileClassName={css.mobileTopbar}
              />
              <UserNav currentPage="ContactDetailsPage" />
            </>
          }
          sideNav={null}
          useAccountSettingsNav
          currentPage="ManageSubscriptionPage"
          footer={<FooterContainer />}
        >
          <div className={css.content}>
            <H3 as="h1">
              <FormattedMessage id="ManageSubscriptionPage.heading" />
            </H3>

            <ManageSubscriptionComponent />
          </div>
        </LayoutSideNavigation>
      </Page>
    </div>
  );
}

const mapStateToProps = state => {
  // Topbar needs user info.
  // const {
  //   currentUser,
  //   currentUserListing,
  //   sendVerificationEmailInProgress,
  //   sendVerificationEmailError,
  // } = state.user;
  // const {
  //   saveEmailError,
  //   savePhoneNumberError,
  //   saveContactDetailsInProgress,
  //   contactDetailsChanged,
  //   resetPasswordInProgress,
  //   resetPasswordError,
  // } = state.ContactDetailsPage;
  // return {
  //   saveEmailError,
  //   savePhoneNumberError,
  //   saveContactDetailsInProgress,
  //   currentUser,
  //   currentUserListing,
  //   contactDetailsChanged,
  //   scrollingDisabled: isScrollingDisabled(state),
  //   sendVerificationEmailInProgress,
  //   sendVerificationEmailError,
  //   resetPasswordInProgress,
  //   resetPasswordError,
  // };
};

const mapDispatchToProps = dispatch => ({
  // onChange: () => dispatch(saveContactDetailsClear()),
  // onResendVerificationEmail: () => dispatch(sendVerificationEmail()),
  // onSubmitContactDetails: values => dispatch(saveContactDetails(values)),
  // onResetPassword: values => dispatch(resetPassword(values)),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ManageSubscriptionPage);
