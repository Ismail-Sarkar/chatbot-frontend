import React from 'react';
import { func, node, object, shape, string } from 'prop-types';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockDefault.module.css';
import { useHistory } from 'react-router-dom';

const FieldMedia = props => {
  const { className, media, sizes, options } = props;
  const hasMediaField = hasDataInFields([media], options);
  return hasMediaField ? (
    <div className={classNames(className, css.media)}>
      <Field data={media} sizes={sizes} options={options} />
    </div>
  ) : null;
};

const BlockDefault = props => {
  const {
    blockId,
    className,
    rootClassName,
    mediaClassName,
    textClassName,
    ctaButtonClass,
    title,
    text,
    callToAction,
    media,
    responsiveImageSizes,
    options,
    sectionId,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const hasTextComponentFields = hasDataInFields([title, text, callToAction], options);

  const history = useHistory();


  return (
    <div
      onClick={() => {
        if ((sectionId === 'categories' || sectionId === 'locations') && callToAction.href) {
          history.push(callToAction.href);
        }
      }}
      className={css.customBlockLink}
    >
      <BlockContainer id={blockId} className={classes}>
        <FieldMedia
          media={media}
          sizes={responsiveImageSizes}
          className={mediaClassName}
          options={options}
        />
        {hasTextComponentFields ? (
          <div className={classNames(textClassName, css.text)}>
            <Field data={title} options={options} />
            <Field data={text} options={options} />
            <Field data={callToAction} className={ctaButtonClass} options={options} />
          </div>
        ) : null}
      </BlockContainer>
    </div>
  );
};

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

BlockDefault.defaultProps = {
  className: null,
  rootClassName: null,
  mediaClassName: null,
  textClassName: null,
  ctaButtonClass: null,
  title: null,
  text: null,
  callToAction: null,
  media: null,
  responsiveImageSizes: null,
  options: null,
};

BlockDefault.propTypes = {
  blockId: string.isRequired,
  className: string,
  rootClassName: string,
  mediaClassName: string,
  textClassName: string,
  ctaButtonClass: string,
  title: object,
  text: object,
  callToAction: object,
  media: object,
  responsiveImageSizes: string,
  options: propTypeOption,
};

export default BlockDefault;
