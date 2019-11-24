const { chain, sumBy } = require("lodash");
const {
  format
  // startOfWeek,
  // endOfWeek
} = require("date-fns");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const chart = require("./chart");

const toHours = ms => ms / (60 * 60 * 1000);
const DAYS_IN_WEEK = 7;

module.exports = ({ query, n = 4 }) => {
  const events = Object.values(filterEvents(getParsedEvents(), query));

  const grouped = chain(events)
    .groupBy(e => format(new Date(e.start), "RII"))
    .toPairs()
    .sortBy(e => e[0])
    .takeRight(n)
    .map(e => {
      const avg = sumBy(e[1], e => e.duration) / DAYS_IN_WEEK;

      // const dateSpan =
      //   format(startOfWeek(new Date(e[1][0].start), { weekStartsOn: 1 }), "R-LL-dd") +
      //   "–" +
      //   format(endOfWeek(new Date(e[1][0].start), { weekStartsOn: 1 }), "R-LL-dd");

      const week = `W${e[0].slice(4, 6)}`;

      return {
        key: week,
        value: toHours(avg)
      };
    })
    .reverse()
    .value();

  console.log(chart(grouped, Math.min(66, process.stdout.columns)));
};
