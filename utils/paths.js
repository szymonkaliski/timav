const envPaths = require("env-paths");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const CONFIG_PATH = envPaths("timav").config;
const DATA_PATH = envPaths("timav").data;

mkdirp(DATA_PATH);
mkdirp(CONFIG_PATH);

const CREDENTIALS_PATH = path.join(CONFIG_PATH, "credentials.json");
const TOKEN_PATH = path.join(DATA_PATH, "token.json");
const SYNC_TOKEN_PATH = path.join(DATA_PATH, "sync_token.json");
const EVENTS_PATH = path.join(DATA_PATH, "events.json");
const PARSED_EVENTS_PATH = path.join(DATA_PATH, "parsed_events.json");

const getParsedEvents = () => {
  if (fs.existsSync(PARSED_EVENTS_PATH)) {
    const data = fs.readFileSync(PARSED_EVENTS_PATH, { encoding: "utf-8" });
    const parsed = JSON.parse(data);

    return parsed;
  }

  return [];
};

const getSyncInfo = () => {
  if (fs.existsSync(SYNC_TOKEN_PATH)) {
    return require(SYNC_TOKEN_PATH);
  }

  return [];
};

module.exports = {
  CREDENTIALS_PATH,
  TOKEN_PATH,
  SYNC_TOKEN_PATH,
  EVENTS_PATH,
  PARSED_EVENTS_PATH,

  getSyncInfo,
  getParsedEvents
};
