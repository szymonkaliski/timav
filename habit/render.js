const { chain } = require("lodash");

const chart = (data, maxBarLength = 100) => {
  return chain(data)
    .takeRight(maxBarLength)
    .map(d => (d.length > 0 ? "━" : " "))
    .join("")
    .value();
};

module.exports = ({ query, streak, histogram }) => {
  const width = Math.min(80, process.stdout.columns);
  const status =
    streak.current === streak.longest
      ? `${streak.current}d`
      : `${streak.current}d / ${streak.longest}d`;

  let info = query;
  info += " ".repeat(width - info.length - status.length);
  info += status;

  return `${info}
${chart(histogram, width)}`;
};
