const { minBy, maxBy, range } = require("lodash");
const chalk = require("chalk");

const { toHours } = require("../utils/date");

const WHISKER = "│";
const LEFT_WHISKER = "├";
const RIGHT_WHISKER = "┤";
const LINE = "─";

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
            return WHISKER;
          }
          if (i === startPosition) {
            return LEFT_WHISKER;
          }
          if (i === endPosition) {
            return RIGHT_WHISKER;
          }
          if (i > startPosition && i < endPosition) {
            return LINE;
          }

          return " ";
        })
        .join("");

      const totalTime = Math.round(toHours(d.totalTime));

      const status = `${totalTime}h`;
      const statusWithColor = `${chalk.gray(totalTime)}h`;

      const project =
        d.project +
        " ".repeat(maxBarLength - status.length - d.project.length) +
        statusWithColor;

      return project + "\n" + chalk.gray(bar);
    })
    .join("\n");
};

module.exports = ({ projects }) => {
  return chart(projects, Math.min(80, process.stdout.columns));
};
