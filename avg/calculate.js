const {
  differenceInDays,
  startOfToday,
  endOfToday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isWithinInterval
} = require("date-fns");

const { chain, sum, sumBy } = require("lodash");

const { filterEvents } = require("../utils/filter");

module.exports = ({ events: allEvents, query, timeframe }) => {
  const events = Object.values(filterEvents(allEvents, query));
  const today = new Date();

  const timeframes = {
    today: { getStartDate: () => startOfToday() },
    week: { getStartDate: () => startOfWeek(today) },
    month: { getStartDate: () => startOfMonth(today) },
    year: { getStartDate: () => startOfYear(today) },
    all: { getStartDate: () => events[0].start }
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
  const avgTime = sum(eventsByDates) / daysInTimeframe;

  return { avgTime };
};
