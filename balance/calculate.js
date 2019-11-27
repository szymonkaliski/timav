const { chain, sumBy } = require("lodash");
const { format } = require("date-fns");

const { filterEvents } = require("../utils/filter");

const DAYS_IN_WEEK = 7;

module.exports = ({ events: allEvents, query, n = 4 }) => {
  const events = Object.values(filterEvents(allEvents, query));

  const data = chain(events)
    .groupBy(e => format(e.start, "RII"))
    .toPairs()
    .sortBy(e => e[0])
    .takeRight(n)
    .map(e => {
      const avg = sumBy(e[1], e => e.duration) / DAYS_IN_WEEK;
      const week = `W${e[0].slice(4, 6)}`;

      return { week, avg };
    })
    .reverse()
    .value();

  return { data };
};
