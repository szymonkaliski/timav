const { chain } = require("lodash");
const chalk = require("chalk");

const chart = (data, maxBarLength = 100) => {
  return chain(data)
    .takeRight(maxBarLength)
    .map(d => (d.length > 0 ? "─" : " "))
    .join("")
    .value();
};

module.exports = ({ query, streak, histogram }) => {
  const width = Math.min(80, process.stdout.columns);
  const { current, longest } = streak;

  const status =
    current === longest ? `${current}d` : `${current}/${longest}d`;

  const statusWithColors =
    current === longest
      ? `${chalk.gray(current)}d`
      : `${chalk.gray(current)}${chalk.gray("/")}${chalk.gray(longest)}d`;

  let info = query.replace("@", "");
  info += " ".repeat(width - info.length - status.length);
  info += statusWithColors;

  return `${info}
${chalk.gray(chart(histogram, width))}`;
};
