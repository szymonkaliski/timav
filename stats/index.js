const { getParsedEvents, getSyncInfo } = require("../utils/paths");
const { formatDistanceToNow } = require("date-fns");
const { sumBy } = require("lodash");

module.exports = () => {
  const events = getParsedEvents();

  const totalTime = sumBy(events, e => e.duration);

  console.log(`Total events: ${events.length}`);
  console.log(`Total time: ${Math.round(totalTime / (60 * 60 * 1000))}h`);
  console.log(`Last sync: ${formatDistanceToNow(getSyncInfo().time, { addSuffix: true })}`);
};
