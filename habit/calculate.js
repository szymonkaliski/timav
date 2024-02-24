const { differenceInDays, endOfDay, startOfDay } = require("date-fns");
const { histogram } = require("d3-array");
const { scaleTime } = require("d3-scale");
const { first, last } = require("lodash");

const { filterEvents } = require("../utils/filter");

const calculateStreak = histogram => {
  const { current, longest } = histogram.reduce(
    (acc, bin) => {
      const current = bin.length > 0 ? acc.current + 1 : 0;

      const longest =
        bin.length === 0 ? Math.max(acc.current, acc.longest) : acc.longest;

      return {
        current,
        longest
      };
    },
    { current: 0, longest: 0 }
  );

  return { longest: Math.max(longest, current), current };
};

module.exports = ({ events: allEvents, query, endDate }) => {
  const events = Object.values(filterEvents(allEvents, query));

  const durationDays = differenceInDays(last(events).start, first(events).end);
  const domain = [startOfDay(first(events).start), endOfDay(endDate || new Date())];
  const scale = scaleTime().domain(domain);

  const calculateHistogram = histogram()
    .value(e => e.start)
    .domain(domain)
    .thresholds(scale.ticks(durationDays));

  const result = calculateHistogram(events);
  const streak = calculateStreak(result);

  return {
    query,
    streak,
    histogram: result
  };
};
