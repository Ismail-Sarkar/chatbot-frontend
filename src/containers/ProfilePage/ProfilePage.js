import React, { useState } from 'react';
import { bool, arrayOf, number, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { REVIEW_TYPE_OF_PROVIDER, REVIEW_TYPE_OF_CUSTOMER, propTypes } from '../../util/types';
import { ensureCurrentUser, ensureUser } from '../../util/data';
import { withViewport } from '../../util/uiHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  Heading,
  H2,
  H4,
  Page,
  AvatarLarge,
  NamedLink,
  ListingCard,
  Reviews,
  ButtonTabNavHorizontal,
  LayoutSideNavigation,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import css from './ProfilePage.module.css';
import CopyText from '../../components/CopyText/CopyText';
import { isEmpty } from 'lodash';
import { withRouter } from 'react-router-dom/cjs/react-router-dom.min';

const MAX_MOBILE_SCREEN_WIDTH = 768;
const MARKETPLACE_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

export const AsideContent = props => {
  const { user, displayName, isCurrentUser, businessname } = props;
  const { publicData } = user?.attributes?.profile || {};
  const { profileUrl = null } = publicData || {};
  return (
    <div className={css.asideContent}>
      <AvatarLarge className={css.avatar} user={user} disableProfileLink />
     
      <H2 as="h1" className={css.mobileHeading}>
        {businessname ? (
          <FormattedMessage id="ProfilePage.mobileHeading" values={{ name: businessname }} />
        ) : null}
      </H2>
      <div className={css.MobHeadWrap}>
      {profileUrl && (
        <div className={classNames(css.profileUrl,css.MobProfileUrl)}>
          <a href={`${MARKETPLACE_URL}/${profileUrl}`}>{profileUrl}</a>
        
        </div>
      )}

      {isCurrentUser ? (
        <>
          <NamedLink className={css.editLinkMobile} name="ProfileSettingsPage">
            <FormattedMessage id="ProfilePage.editProfileLinkMobile" />
          </NamedLink>
          <NamedLink className={css.editLinkDesktop} name="ProfileSettingsPage">
            <FormattedMessage id="ProfilePage.editProfileLinkDesktop" />
          </NamedLink>
        </>
      ) : null}
      </div>
    </div>
  );
};

export const ReviewsErrorMaybe = props => {
  const { queryReviewsError } = props;
  return queryReviewsError ? (
    <p className={css.error}>
      <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
    </p>
  ) : null;
};

export const MobileReviews = props => {
  const { reviews, queryReviewsError } = props;
  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  return (
    <div className={css.mobileReviews}>
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsFromMyCustomersTitle"
          values={{ count: reviewsOfProvider.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfProvider} />
      {/* <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsAsACustomerTitle"
          values={{ count: reviewsOfCustomer.length }}
        />
      </H4> */}
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfCustomer} />
    </div>
  );
};

export const DesktopReviews = props => {
  const [showReviewsType, setShowReviewsType] = useState(REVIEW_TYPE_OF_PROVIDER);
  const { reviews, queryReviewsError } = props;
  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  const isReviewTypeProviderSelected = showReviewsType === REVIEW_TYPE_OF_PROVIDER;
  const isReviewTypeCustomerSelected = showReviewsType === REVIEW_TYPE_OF_CUSTOMER;
  const desktopReviewTabs = [
    {
      text: (
        <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
          <FormattedMessage
            id="ProfilePage.reviewsFromMyCustomersTitle"
            values={{ count: reviewsOfProvider.length }}
          />
        </Heading>
      ),
      selected: isReviewTypeProviderSelected,
      onClick: () => setShowReviewsType(REVIEW_TYPE_OF_PROVIDER),
    },
    // {
    //   text: (
    //     <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
    //       <FormattedMessage
    //         id="ProfilePage.reviewsAsACustomerTitle"
    //         values={{ count: reviewsOfCustomer.length }}
    //       />
    //     </Heading>
    //   ),
    //   selected: isReviewTypeCustomerSelected,
    //   onClick: () => setShowReviewsType(REVIEW_TYPE_OF_CUSTOMER),
    // },
  ];

  return (
    <div className={css.desktopReviews}>
      <div className={css.desktopReviewsWrapper}>
        <ButtonTabNavHorizontal className={css.desktopReviewsTabNav} tabs={desktopReviewTabs} />

        <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />

        {isReviewTypeProviderSelected ? (
          <Reviews reviews={reviewsOfProvider} />
        ) : (
          <Reviews reviews={reviewsOfCustomer} />
        )}
      </div>
    </div>
  );
};

export const MainContent = props => {
  const {
    userShowError,
    bio,
    displayName,
    listings,
    queryListingsError,
    reviews,
    queryReviewsError,
    viewport,
    businessname,
    user,
  } = props;

  const hasListings = listings.length > 0;
  const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;
  const hasBio = !!bio;

  const { publicData } = user?.attributes?.profile || {};
  const { profileUrl = null } = publicData || {};
  const isPartner = publicData?.userType === 'partner';

  const listingsContainerClasses = classNames(css.listingsContainer, {
    [css.withBioMissingAbove]: !hasBio,
  });

  if (userShowError || queryListingsError) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProfilePage.loadingDataFailed" />
      </p>
    );
  }
  return (
    <div>
      <H2 as="h1" className={css.desktopHeading}>
        <FormattedMessage
          id="ProfilePage.desktopHeading"
          values={{ name: businessname ?? displayName }}
        />
      </H2>
      {profileUrl && (
        <div className={classNames(css.profileUrl,css.desktopProfileUrl)}>
          <a href={`${MARKETPLACE_URL}/${profileUrl}`}>{profileUrl}</a>
          {/* <CopyText text={`${MARKETPLACE_URL}/${profileUrl}`} /> */}
        </div>
      )}
      {hasBio ? <p className={css.bio}>{bio}</p> : null}
      {hasListings ? (
        <div className={listingsContainerClasses}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="ProfilePage.listingsTitle" values={{ count: listings.length }} />
          </H4>
          <ul className={css.listings}>
            {listings.map(l => (
              <li className={css.listing} key={l.id.uuid}>
                <ListingCard listing={l} showAuthorInfo={false} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isPartner ? (
        isMobileLayout ? (
          <MobileReviews reviews={reviews} queryReviewsError={queryReviewsError} />
        ) : (
          <DesktopReviews reviews={reviews} queryReviewsError={queryReviewsError} />
        )
      ) : null}
    </div>
  );
};

const ProfilePageComponent = props => {
  const config = useConfiguration();
  const {
    scrollingDisabled,
    currentUser,
    userShowError,
    user,
    intl,
    userShowSuccess,
    currentUserShowSuccess,
    history,
    location,
    ...rest
  } = props;
  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const profileUser = ensureUser(user);
  const isCurrentUser =
    ensuredCurrentUser.id && profileUser.id && ensuredCurrentUser.id.uuid === profileUser.id.uuid;
  const { bio, displayName } = profileUser?.attributes?.profile || {};
  const businessname = profileUser?.attributes?.profile?.publicData?.businessName;

  const schemaTitleVars = {
    name: businessname ?? displayName,
    marketplaceName: config.marketplaceName,
  };
  const schemaTitle = intl.formatMessage({ id: 'ProfilePage.schemaTitle' }, schemaTitleVars);

  if (userShowError && userShowError.status === 404) {
    return <NotFoundPage />;
  }

  const { publicData } = user?.attributes?.profile || {};
  const isPartner = publicData?.userType === 'partner';

  if (!isPartner && userShowSuccess) {
    history.push({
      pathname: '/',
    });
    // history.push({
    //   pathname: '/login',
    //   state: { from: `${location.pathname}${location.search}${location.hash}` },
    // });
  }
  return userShowSuccess ? (
    <Page
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ProfilePage',
        name: schemaTitle,
      }}
    >
      <div className={css.profilepagewrap}>
      <LayoutSideNavigation
        sideNavClassName={css.aside}
        topbar={<TopbarContainer currentPage="ProfilePage" />}
        sideNav={
          <AsideContent
            user={user}
            isCurrentUser={isCurrentUser}
            displayName={displayName}
            businessname={businessname}
          />
        }
        footer={<FooterContainer />}
      >
        <MainContent
          bio={bio}
          user={user}
          displayName={displayName}
          userShowError={userShowError}
          businessname={businessname}
          {...rest}
        />
      </LayoutSideNavigation>
      </div>
    </Page>
  ) : (
    <></>
  );
};

ProfilePageComponent.defaultProps = {
  currentUser: null,
  user: null,
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

ProfilePageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  currentUser: propTypes.currentUser,
  user: propTypes.user,
  userShowError: propTypes.error,
  queryListingsError: propTypes.error,
  listings: arrayOf(propTypes.listing).isRequired,
  reviews: arrayOf(propTypes.review),
  queryReviewsError: propTypes.error,

  // form withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser, currentUserShowSuccess } = state.user;
  const {
    userId,
    userShowError,
    queryListingsError,
    userListingRefs,
    reviews,
    queryReviewsError,
    userShowSuccess,
  } = state.ProfilePage;
  const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  const user = userMatches.length === 1 ? userMatches[0] : null;
  const listings = getMarketplaceEntities(state, userListingRefs);
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    user,
    userShowError,
    queryListingsError,
    listings,
    reviews,
    queryReviewsError,
    userShowSuccess,
    currentUserShowSuccess,
  };
};

const ProfilePage = compose(
  connect(mapStateToProps),
  withViewport,
  injectIntl,
  withRouter
)(ProfilePageComponent);

export default ProfilePage;
