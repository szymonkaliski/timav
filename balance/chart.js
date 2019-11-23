// adapted from https://github.com/morishin/ascii-horizontal-barchart

const { maxBy } = require("lodash");

const bar = (value, maxValue, maxBarLength) => {
  // const fractions = ["▏", "▎", "▍", "▋", "▊", "▉"];
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
  const maxValue = maxBy(data, d => d.value).value;

  return data
    .map(d => {
      const prefix = d.key;
      const barText = bar(d.value, maxValue, maxBarLength);

      return `${prefix}: ${d.value.toFixed(2)}h/d  ${barText}`;
    })
    .join("\n");
};

module.exports = chart;
