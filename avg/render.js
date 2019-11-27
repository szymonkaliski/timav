const { toHours } = require("../utils/date");

module.exports = ({ avgTime }) => {
  return `${toHours(avgTime).toFixed(2)}h/d`;
};
