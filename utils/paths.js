const envPaths = require("env-paths");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const CACHE_PATH = envPaths("timav").cache;
const CONFIG_PATH = envPaths("timav").config;

mkdirp(CACHE_PATH);
mkdirp(CONFIG_PATH);

const CREDENTIALS_PATH = path.join(CONFIG_PATH, "credentials.json");
const TOKEN_PATH = path.join(CACHE_PATH, "token.json");
const SYNC_TOKEN_PATH = path.join(CACHE_PATH, "sync_token.json");
const EVENTS_PATH = path.join(CACHE_PATH, "events.json");
const PARSED_EVENTS_PATH = path.join(CACHE_PATH, "parsed_events.json");

const getParsedEvents = () => {
  if (fs.existsSync(PARSED_EVENTS_PATH)) {
    return require(PARSED_EVENTS_PATH);
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
