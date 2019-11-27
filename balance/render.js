// chart adapted from https://github.com/morishin/ascii-horizontal-barchart

const { maxBy } = require("lodash");
const { toHours } = require("../utils/date");

const bar = (value, maxValue, maxBarLength) => {
  const fractions = ["━"];

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
  const maxAvg = maxBy(data, d => d.avg).avg;

  return data
    .map(d => {
      const prefix = d.week;
      const barText = bar(d.avg, maxAvg, maxBarLength);

      return `${prefix}: ${toHours(d.avg).toFixed(2)}h/d  ${barText}`;
    })
    .join("\n");
};

module.exports = ({ data }) => {
  return chart(data, Math.min(66, process.stdout.columns));
};
