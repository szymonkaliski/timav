const {
  differenceInDays,
  startOfToday,
  endOfToday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isWithinInterval
} = require("date-fns");

const { chain, sum, sumBy, minBy } = require("lodash");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const toHours = ms => ms / (60 * 60 * 1000);

module.exports = ({ query, timeframe }) => {
  const events = Object.values(filterEvents(getParsedEvents(), query));
  const oldestEvent = minBy(events, e => new Date(e.start));

  const timeframes = {
    today: { startDate: startOfToday() },
    week: { startDate: startOfWeek(new Date()) },
    month: { startDate: startOfMonth(new Date()) },
    year: { startDate: startOfYear(new Date()) },
    all: { startDate: new Date(oldestEvent.start) }
  };

  const { startDate } = timeframes[timeframe];

  const eventsByDates = chain(events)
    .filter(e =>
      isWithinInterval(new Date(e.start), {
        start: startDate,
        end: endOfToday()
      })
    )
    .groupBy(e => e.startDateStr.split("T")[0])
    .map(group => sumBy(group, e => e.duration))
    .value();

  const daysInTimeframe = differenceInDays(new Date(), startDate) + 1;
  const avgTime = toHours(sum(eventsByDates) / daysInTimeframe);

  console.log(`${avgTime.toFixed(2)}h/d`);
};
