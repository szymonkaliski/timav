const { chain } = require("lodash");

const chart = (data, maxBarLength = 100) => {
  return chain(data)
    .takeRight(maxBarLength)
    .map(d => (d.length > 0 ? "━" : " "))
    .join("")
    .value();
};

module.exports = chart;
