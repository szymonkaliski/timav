const { formatDistanceToNow } = require("date-fns");
const { toHours } = require("../utils/date");
const chalk = require("chalk");

module.exports = ({ eventsCount, totalTime, lastSync }) => {
  const sync = formatDistanceToNow(lastSync, { addSuffix: true });
  const events = `${chalk.gray(eventsCount)} events`;
  const hours = `${chalk.gray(Math.round(toHours(totalTime)))} hours`;

  return `${events} ${chalk.gray("/")} ${hours} ${chalk.gray("/")} last synced ${sync}`;
};
