import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../routing/routeConfiguration';
import { propTypes } from '../../../util/types';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  ExternalLink,
} from '../../../components';
import { LiaSearchSolid } from 'react-icons/lia';
import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';

import css from './TopbarDesktop.module.css';

const TopbarDesktop = props => {
  const {
    className,
    appConfig,
    currentUser,
    currentPage,
    rootClassName,
    currentUserHasListings,
    notificationCount,
    intl,
    isAuthenticated,
    onLogout,
    onSearchSubmit,
    initialSearchFormValues,
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketplaceName = appConfig.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  const search = (
    <TopbarSearchForm
      className={classNames(css.searchLink, { [css.authenticatedSearchBar]: isAuthenticated })}
      desktopInputRoot={css.topbarSearchWithLeftPadding}
      onSubmit={onSearchSubmit}
      initialValues={initialSearchFormValues}
      appConfig={appConfig}
    />
  );

  const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;

  const inboxLink = authenticatedOnClientSide ? (
    <NamedLink
      className={css.inboxLink}
      name="InboxPage"
      params={{
        tab:
          currentUser?.attributes?.profile?.publicData?.userType === 'partner' ? 'sales' : 'orders',
      }}
    >
      <span className={classNames(css.inbox, { [css.authenticatedLink]: isAuthenticated })}>
        <FormattedMessage id="TopbarDesktop.inbox" />
        {notificationDot}
      </span>
    </NamedLink>
  ) : null;

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const profileMenu = authenticatedOnClientSide ? (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        {currentUser?.attributes?.profile?.publicData?.userType === 'partner' ? (
          <MenuItem key="ManageListingsPage">
            <NamedLink
              className={classNames(css.yourListingsLink, currentPageClass('ManageListingsPage'))}
              name="ManageListingsPage"
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.yourListingsLink" />
            </NamedLink>
          </MenuItem>
        ) : (
          <MenuItem key=""></MenuItem>
        )}
        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.profileSettingsLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.profileSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;
  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );
  const signupLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="SignupPage" className={css.signupLink}>
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );
  const isSafari = typeof navigator !== 'undefined' ? navigator.userAgent.includes("safari") : false
 
  return (
    <nav className={classes}>
      <LinkedLogo
        className={css.logoLink}
        format="desktop"
        alt={intl.formatMessage({ id: 'TopbarDesktop.logo' },  { marketplaceName })}
        isAuthenticated={isAuthenticated}
      />
      {/* {search} */}
      {currentPage === 'SearchPage' ? (
        search
      ) : (
        <NamedLink
          className={classNames(css.searchLink, css.searchWithIcon, {
            [css.authSearchLink]: isAuthenticated,
          })}
          name="SearchPage"
        >
          <LiaSearchSolid size={25} />
          <div className={classNames(css.searchTitle,{[css.safariMargin]:isSafari})}>Search passes</div>
        </NamedLink>
      )}

      {currentUser?.attributes?.profile?.publicData?.userType === 'partner' ? (
        <NamedLink className={css.createListingLink} name="NewListingPage">
          <span className={css.createListing}>
            <FormattedMessage id="TopbarDesktop.createListing" />
          </span>
        </NamedLink>
      ) : !isAuthenticated ? (
        // <NamedLink className={css.createListingLink} name="NewListingPage">
        <NamedLink name="PartnerSignupPage" className={css.loginLink}>
          <span className={css.createListing}>
            <FormattedMessage id="TopbarDesktop.createListing" />
          </span>
        </NamedLink>
      ) : (
        ''
      )}

      <ExternalLink
        href="https://adventurely.app/blog"
        className={classNames(css.blogLink, { [css.BlogauthenticatedLink]: isAuthenticated })}
        name="Blog"
      >
        <span
          className={classNames(css.createListing, { [css.authenticatedLink]: isAuthenticated })}
        >
          <FormattedMessage id="TopbarDesktop.blog" />
        </span>
      </ExternalLink>
      {inboxLink}
      {profileMenu}
      {loginLink}
      {signupLink}
    </nav>
  );
};

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  appConfig: null,
};

TopbarDesktop.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentPage: string,
  isAuthenticated: bool.isRequired,
  onLogout: func.isRequired,
  notificationCount: number,
  onSearchSubmit: func.isRequired,
  initialSearchFormValues: object,
  intl: intlShape.isRequired,
  appConfig: object,
};

export default TopbarDesktop;
