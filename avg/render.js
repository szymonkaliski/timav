const { toHours } = require("../utils/date");

module.exports = ({ avgTime }) => {
  console.log(`${toHours(avgTime).toFixed(2)}h/d`);
};
