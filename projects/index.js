const { chain, sumBy, minBy, maxBy, groupBy } = require("lodash");

const { getParsedEvents } = require("../utils/paths");
const { filterEvents } = require("../utils/filter");

const chart = require("./chart");

const parseISOLocal = str => {
  const d = str.split(/\D/);
  return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
};

const toHours = ms => ms / (60 * 60 * 1000);

module.exports = ({ query, n }) => {
  let events = getParsedEvents();

  if (query) {
    events = filterEvents(events, query);
  }

  let projects = chain(events)
    .values()
    .filter(e => !!e.project)
    .groupBy(e => e.project)
    .map(g => {
      const start = parseISOLocal(minBy(g, e => parseISOLocal(e.start)).start);
      const end = parseISOLocal(maxBy(g, e => parseISOLocal(e.end)).end);
      const totalTime = toHours(sumBy(g, e => e.duration));
      const totalDays = Object.keys(groupBy(g, e => e.start.split("T")[0]))
        .length;

      const tags = chain(g)
        .map(g => g.tags)
        .flatten()
        .map(t => (t.subTag ? `${t.tag}(${t.subTag})` : t.tag))
        .uniq()
        .value();

      return {
        project: g[0].project,
        numEvents: g.length,
        start,
        end,
        tags,
        totalTime,
        totalDays
      };
    })
    .sortBy(g => g.end);

  if (n !== undefined) {
    projects = projects.takeRight(n);
  }

  projects = projects.reverse().value();

  console.log(chart(projects, Math.min(80, process.stdout.columns)));
};
