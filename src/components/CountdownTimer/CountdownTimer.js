import React, { useState, useEffect } from 'react';
import moment from 'moment';

const CountdownTimer = ({ endTime }) => {
  const calculateTimeLeft = () => {
    const difference = moment(endTime).diff(moment());
    const duration = moment.duration(difference);
    return {
      days: duration.days(),
      hours: duration.hours(),
      minutes: duration.minutes(),
      //   seconds: duration.seconds(),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach(interval => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval}>
        {timeLeft[interval]} {interval}{' '}
      </span>
    );
  });

  return <>{timerComponents.length ? timerComponents : <span>0 hours</span>}</>;
};

export default CountdownTimer;
