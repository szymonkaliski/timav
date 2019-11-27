const { formatDistanceToNow } = require("date-fns");
const { toHours } = require("../utils/date");

module.exports = ({ eventsCount, totalTime, lastSync }) => {
  console.log(`Total events: ${eventsCount}`);
  console.log(`Total time:   ${Math.round(toHours(totalTime))}h`);
  console.log(
    `Last sync:    ${formatDistanceToNow(lastSync, { addSuffix: true })}`
  );
};
