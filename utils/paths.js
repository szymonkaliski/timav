const envPaths = require("env-paths");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const CONFIG_PATH = envPaths("timav").config;
const DATA_PATH = envPaths("timav").data;

mkdirp(DATA_PATH);
mkdirp(CONFIG_PATH);

const CREDENTIALS_PATH = path.join(CONFIG_PATH, "credentials.json");
const CONFIG_FILE_PATH = path.join(CONFIG_PATH, "config.json");

const tokenPath = calendar => path.join(DATA_PATH, `${calendar}-token.json`);
const syncTokenPath = calendar =>
  path.join(DATA_PATH, `${calendar}-sync_token.json`);
const eventsPath = calendar => path.join(DATA_PATH, `${calendar}-events.json`);
const parsedEventsPath = calendar =>
  path.join(DATA_PATH, `${calendar}-parsed_events.json`);

const parseISOLocal = str => {
  const d = str.split(/\D/);
  return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
};

const getParsedEvents = ({ calendar }) => {
  const fileName = parsedEventsPath(calendar);

  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName, { encoding: "utf-8" });
    const parsed = JSON.parse(data);

    const result = parsed.map(e => {
      e.start = parseISOLocal(e.start);
      e.end = parseISOLocal(e.end);

      return e;
    });

    return result;
  }

  return [];
};

const getSyncInfo = ({ calendar }) => {
  const fileName = syncTokenPath(calendar);

  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName, { encoding: "utf-8" });
    const parsed = JSON.parse(data);

    return parsed;
  }

  return [];
};

const hasCredentials = () => fs.existsSync(CREDENTIALS_PATH);

const hasConfigFile = () => fs.existsSync(CONFIG_FILE_PATH);

module.exports = {
  CREDENTIALS_PATH,
  CONFIG_PATH,
  CONFIG_FILE_PATH,

  hasCredentials,
  hasConfigFile,

  getSyncInfo,
  getParsedEvents,

  tokenPath,
  syncTokenPath,
  eventsPath,
  parsedEventsPath
};
