const { chain, sumBy, minBy, maxBy, groupBy } = require("lodash");
const { filterEvents } = require("../utils/filter");

module.exports = ({ events: allEvents, query, n }) => {
  let events = allEvents;

  if (query) {
    events = filterEvents(events, query);
  }

  let projects = chain(events)
    .values()
    .filter(e => !!e.project)
    .groupBy(e => e.project)
    .map(g => {
      const start = minBy(g, e => e.start).start;
      const end = maxBy(g, e => e.end).end;
      const totalTime = sumBy(g, e => e.duration);
      const totalDays = Object.keys(
        groupBy(g, e => e.startDateStr.split("T")[0])
      ).length;

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

  return { projects: projects.reverse().value() };
};
