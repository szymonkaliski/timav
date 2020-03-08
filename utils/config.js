const { CONFIG_FILE_PATH } = require("./paths");

const loadConfig = () => {
  let config;

  try {
    config = require(CONFIG_FILE_PATH);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  return config;
};

module.exports = { loadConfig };
