const path = require("path");

const { CONFIG_PATH } = require("./paths");
const CONFIG_FILE = path.join(CONFIG_PATH, "config.json");

const loadConfig = () => {
  let config;

  try {
    config = require(CONFIG_FILE);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  return config;
};

module.exports = { loadConfig };
