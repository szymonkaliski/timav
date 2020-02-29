const { chain, sumBy } = require("lodash");

module.exports = ({ events, n }) => {
  let tags = chain(events)
    .flatMap(e => e.tags.map(({ tag }) => ({ tag, duration: e.duration })))
    .groupBy(({ tag }) => tag.trim())
    .map((group, tag) => ({ tag, duration: sumBy(group, "duration") }))
    .filter(({ duration }) => duration > 0)
    .sortBy("duration");

  if (n !== undefined) {
    tags = tags.takeRight(n);
  }

  tags = tags.reverse().value();

  return tags;
};
