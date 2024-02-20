import React from 'react';
import { arrayOf, bool, func, node, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import { ExternalLink, LinkedLogo, NamedLink } from '../../../../components';

import Field from '../../Field';
import BlockBuilder from '../../BlockBuilder';

import SectionContainer from '../SectionContainer';
import css from './SectionFooter.module.css';

// The number of columns (numberOfColumns) affects styling

const GRID_CONFIG = [
  { contentCss: css.contentCol1, gridCss: css.gridCol1 },
  { contentCss: css.contentCol2, gridCss: css.gridCol2 },
  { contentCss: css.contentCol3, gridCss: css.gridCol3 },
  { contentCss: css.contentCol4, gridCss: css.gridCol4 },
];

const getIndex = numberOfColumns => numberOfColumns - 1;

const getContentCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.contentCss : GRID_CONFIG[0].contentCss;
};

const getGridCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.gridCss : GRID_CONFIG[0].gridCss;
};

// Section component that's able to show blocks in multiple different columns (defined by "numberOfColumns" prop)
const SectionFooter = props => {
  const {
    sectionId,
    className,
    rootClassName,
    numberOfColumns,
    socialMediaLinks,
    slogan,
    appearance,
    copyright,
    blocks,
    options,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };
  const linksWithBlockId = socialMediaLinks?.map(sml => {
    return {
      ...sml,
      blockId: sml.link.platform,
    };
  });

  const showSocialMediaLinks = socialMediaLinks?.length > 0;

  // use block builder instead of mapping blocks manually

  return (
    <SectionContainer
      as="footer"
      id={sectionId}
      className={className || css.root}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
    >
      <div className={css.footer}>
        <div className={classNames(css.content, getContentCss(numberOfColumns))}>
          <div>
            <LinkedLogo rootClassName={css.logoLink} logoClassName={css.logoImage} />
          </div>
          <div className={css.sloganMobile}>
            <Field data={slogan} className={css.slogan} />
            {showSocialMediaLinks ? (
              <div className={classNames(css.icons, css.iconsMobile)}>
                <BlockBuilder blocks={linksWithBlockId} options={options} />
              </div>
            ) : null}
          </div>
          <div className={css.detailsInfo}>
            <div className={css.sloganDesktop}>
              <Field data={slogan} className={css.slogan} />
            </div>
            {showSocialMediaLinks ? (
              <div className={classNames(css.icons, css.iconsDesktop)}>
                <BlockBuilder blocks={linksWithBlockId} options={options} />
              </div>
            ) : null}
            <Field data={copyright} className={css.copyright} />
          </div>
          <div className={classNames(css.grid, getGridCss(numberOfColumns))}>
            <BlockBuilder blocks={blocks} options={options} />
          </div>
          {/* <div className={css.textLinkDiv}>
            <div>
              <div>
                <NamedLink
                  className={classNames(css.searchLink, css.searchWithIcon)}
                  name="SearchPage"
                >
                  <span className={css.searchTitle}>Browse day passes</span>
                </NamedLink>
                <ExternalLink href="https://adventurely.pro" className={css.termsLink}>
                  <span>List your space</span>
                </ExternalLink>
                <ExternalLink
                  href="https://www.notion.so/Adventurely-FAQ-3d07f72573b64224b48e9df3b32c333b?pvs=4"
                  className={css.termsLink}
                >
                  <span>FAQ/How it Works</span>
                </ExternalLink>
                <ExternalLink
                  href="https://www.notion.so/Contact-b241c3b1a1a44c278cebd55ca219723e"
                  className={css.termsLink}
                >
                  <span>Contact</span>
                </ExternalLink>
              </div>
              <div>
                <ExternalLink href="http://www.adventurely.pro" className={css.termsLink}>
                  <span>Parnters</span>
                </ExternalLink>
                <ExternalLink
                  href=" https://www.notion.so/Adventurely-Terms-of-Use-Privacy-Policy-0d54a870182340368c23d23f08793d7f?pvs=4"
                  className={css.termsLink}
                >
                  <span>Get nomad insurance</span>
                </ExternalLink>
              </div>
            </div>
            <div>
              <ExternalLink
                href="https://www.notion.so/Adventurely-Terms-of-Use-Privacy-Policy-0d54a870182340368c23d23f08793d7f?pvs=4"
                className={css.termsLink}
              >
                <span>Terms of Use</span>
              </ExternalLink>
              <ExternalLink
                href="https://www.notion.so/Adventurely-Terms-of-Use-Privacy-Policy-0d54a870182340368c23d23f08793d7f?pvs=4"
                className={css.termsLink}
              >
                <span>Privacy Policy</span>
              </ExternalLink>
            </div>
          </div> */}
        </div>
      </div>
    </SectionContainer>
  );
};

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

SectionFooter.defaultProps = {
  className: null,
  rootClassName: null,
  textClassName: null,
  numberOfColumns: 1,
  socialMediaLinks: [],
  slogan: null,
  copyright: null,
  appearance: null,
  blocks: [],
  options: null,
};

SectionFooter.propTypes = {
  sectionId: string.isRequired,
  className: string,
  rootClassName: string,
  numberOfColumns: number,
  socialMediaLinks: arrayOf(object),
  slogan: object,
  copyright: object,
  appearance: object,
  blocks: arrayOf(object),
  options: propTypeOption,
};

export default SectionFooter;
