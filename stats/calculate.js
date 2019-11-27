const { getSyncInfo } = require("../utils/paths");
const { sumBy } = require("lodash");

module.exports = ({ events }) => {
  const totalTime = sumBy(events, e => e.duration);

  return {
    eventsCount: events.length,
    totalTime,
    lastSync: getSyncInfo().time
  };
};
