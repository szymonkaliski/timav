const { endOfYesterday, startOfWeek, startOfMonth, isAfter } = require("date-fns");
const { sumBy } = require("lodash");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const toHours = ms => ms / (60 * 60 * 1000);

module.exports = ({ query }) => {
  const events = Object.values(filterEvents(getParsedEvents(), query));

  const timeframes = [
    { name: "Today", startDate: endOfYesterday() },
    { name: "This Week", startDate: startOfWeek(new Date()) },
    { name: "This Month", startDate: startOfMonth(new Date()) }
    // { name: "last year" },
    // { name: "all time" }
  ];

  timeframes.forEach(({ name, startDate }) => {
    const matchingEvents = events.filter(e => isAfter(new Date(e.start), startDate));
    const totalTime = sumBy(matchingEvents, e => e.duration);
    const avgTime = toHours(totalTime / matchingEvents.length); // TODO: avg daily, not avg event!

    console.log(`${name}: ${avgTime.toFixed(2)}h`);
  });
};
