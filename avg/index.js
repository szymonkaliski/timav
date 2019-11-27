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
  const today = new Date();

  const timeframes = {
    today: { getStartDate: () => startOfToday() },
    week: { getStartDate: () => startOfWeek(today) },
    month: { getStartDate: () => startOfMonth(today) },
    year: { getStartDate: () => startOfYear(today) },
    all: { getStartDate: () => minBy(events, e => e.start).start }
  };

  const { getStartDate } = timeframes[timeframe];
  const startDate = getStartDate();

  const eventsByDates = chain(events)
    .filter(e =>
      isWithinInterval(e.start, {
        start: startDate,
        end: endOfToday()
      })
    )
    .groupBy(e => e.startDateStr.split("T")[0])
    .map(group => sumBy(group, e => e.duration))
    .value();

  const daysInTimeframe = differenceInDays(today, startDate) + 1;
  const avgTime = toHours(sum(eventsByDates) / daysInTimeframe);

  console.log(`${avgTime.toFixed(2)}h/d`);
};
