const { minBy, maxBy, range } = require("lodash");

const LINE = "▎";
const LEFT_WHISKER = "┣";
const RIGHT_WHISKER = "┫";
const WHISKER = "━";

const chart = (data, maxBarLength = 100) => {
  const earliest = minBy(data, d => d.start).start;
  const latest = maxBy(data, d => d.end).end;

  const scale = t => {
    return (
      (t.getTime() - earliest.getTime()) /
      (latest.getTime() - earliest.getTime())
    );
  };

  return data
    .map(d => {
      const startPercent = scale(d.start);
      const endPercent = scale(d.end);

      const startPosition = Math.round(startPercent * (maxBarLength - 1));
      const endPosition = Math.round(endPercent * (maxBarLength - 1));

      const bar = range(maxBarLength)
        .map(i => {
          if (i === startPosition && i === endPosition) {
            return LINE;
          }
          if (i === startPosition) {
            return LEFT_WHISKER;
          }
          if (i === endPosition) {
            return RIGHT_WHISKER;
          }
          if (i > startPosition && i < endPosition) {
            return WHISKER;
          }

          return " ";
        })
        .join("");

      const status = `${d.totalTime.toFixed(2)}h / ${d.totalDays}d`;
      const project =
        d.project +
        " ".repeat(maxBarLength - status.length - d.project.length) +
        status;

      return project + "\n" + bar;
    })
    .join("\n");
};

module.exports = ({ projects }) => {
  console.log(chart(projects, Math.min(80, process.stdout.columns)));
};
