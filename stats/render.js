const { formatDistanceToNow } = require("date-fns");
const { toHours } = require("../utils/date");

module.exports = ({ eventsCount, totalTime, lastSync }) => {
  return `Total events: ${eventsCount}
Total time:   ${Math.round(toHours(totalTime))}h
Last sync:    ${formatDistanceToNow(lastSync, { addSuffix: true })}
`;
};
