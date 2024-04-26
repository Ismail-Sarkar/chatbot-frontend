import React from 'react';
import css from './CardViewer.module.css';

const Card = ({ data }) => {
  return (
    <div className={css.card}>
      {data.map((item, index) => {
        console.log('item', item.card);
        return (
          <div className={css.cardItem} key={index}>
            <img src={item.card?.imageUri} alt={item.card?.title} className={css.cardImage} />
            <div className={css.cardOverlay}>
              <div className={css.cardTitle}>{item.card?.title}</div>
              {/* <div className={css.cardSubtitle}>
                dangerouslySetInnerHTML={{ __html: item.card?.subtitle }}
              </div> */}
              <div
                className={css.cardSubtitle}
                dangerouslySetInnerHTML={{ __html: item.card?.subtitle }}
              />
            </div>
            <a href={item.card?.buttons[0].postback} className={css.cardButton}>
              {item.card?.buttons[0].text}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Card;
