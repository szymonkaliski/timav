const {
  differenceInDays,
  endOfYesterday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isAfter
} = require("date-fns");
const { chain, sum, sumBy, minBy } = require("lodash");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const toHours = ms => ms / (60 * 60 * 1000);

module.exports = ({ query }) => {
  const events = Object.values(filterEvents(getParsedEvents(), query));
  const oldestEvent = minBy(events, e => new Date(e.start));

  const timeframes = [
    { name: "Today:      ", startDate: endOfYesterday() },
    { name: "This Week:  ", startDate: startOfWeek(new Date()) },
    { name: "This Month: ", startDate: startOfMonth(new Date()) },
    { name: "This Year:  ", startDate: startOfYear(new Date()) },
    { name: "All Time:   ", startDate: new Date(oldestEvent.start) }
  ];

  timeframes.forEach(({ name, startDate }) => {
    const eventsByDates = chain(events)
      .filter(e => (startDate ? isAfter(new Date(e.start), startDate) : true))
      .groupBy(e => e.startDateStr.split("T")[0])
      .map(group => sumBy(group, e => e.duration))
      .value();

    const daysInTimeframe = differenceInDays(new Date(), startDate) + 1;
    const avgTime = toHours(sum(eventsByDates) / daysInTimeframe);

    console.log(`${name}${avgTime.toFixed(2)}h/d`);
  });
};
