const cron = require('node-cron');

const timers = {
  everyMidnight: '1 0 * * *',
  everyMinute: '* * * * *',
  everyFiveMinute: '*/5 * * * *',
  everySixHour: '1 */6 * * *',
};
const cronScheduler = (timer, callback) => {
  cron.schedule(timer, callback);
};

module.exports = {
  cronTimers: timers,
  cronScheduler,
};
