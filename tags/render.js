const { maxBy, padEnd } = require("lodash");
const { toHours } = require("../utils/date");
const chalk = require("chalk");

const bar = (value, maxValue, maxBarLength) => {
  const fractions = ["─"];

  const barLength = (value * maxBarLength) / maxValue;
  const wholeNumberPart = Math.floor(barLength);
  const fractionalPart = barLength - wholeNumberPart;

  let bar = fractions[fractions.length - 1].repeat(wholeNumberPart);

  if (fractionalPart > 0) {
    bar += fractions[Math.floor(fractionalPart * fractions.length)];
  }

  return bar;
};

const chart = (data, maxBarLength = 100) => {
  const maxDuration = maxBy(data, "duration").duration;
  const maxTitleLength = maxBy(data, d => d.tag.length).tag.length;
  const maxDurationLength = toHours(maxDuration).toFixed(0).length;

  return data
    .map(d => {
      const prefix = padEnd(d.tag, maxTitleLength);

      const barText = bar(
        d.duration,
        maxDuration,
        maxBarLength - maxDurationLength - maxTitleLength - 3
      );

      const hours = toHours(d.duration).toFixed(0);

      return `${prefix} ${chalk.gray(barText)} ${chalk.gray(hours)}h`;
    })
    .join("\n");
};

module.exports = data => {
  return chart(data, Math.min(80, process.stdout.columns));
};
