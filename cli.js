#!/usr/bin/env node

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const yargs = require("yargs");
const { spawn } = require("child_process");

const cache = require("./cache");
const habit = require("./habit");
const projects = require("./projects");
const stats = require("./stats");
const tags = require("./tags");

const { CONFIG_PATH } = require("./utils/paths");
const { getParsedEvents } = require("./utils/paths");
const { loadConfig } = require("./utils/config");

const CONFIG_FILE = path.join(CONFIG_PATH, "config.json");
const DEFAULT_CONFIG = {};

mkdirp(CONFIG_PATH);

const args = yargs
  .command("config", "open configuration file")
  .command("cache", "cache updated events")
  .command("stats", "show basic stats")
  .command("tags", "top tags", yargs => {
    yargs.option("n", {
      describe: "show top [n] tags",
      default: 10
    });
  })
  .command("habit <query>", "habit and streak for <query>")
  .command(
    "projects [query]",
    "show projects matching optional [query]",
    yargs => {
      yargs.option("n", {
        describe: "show last [n] project",
        default: 10
      });
    }
  )
  .demandCommand(1, "you need to provide a command")
  .help().argv;

const [TYPE] = args._;

if (TYPE === "config") {
  const editor = process.env.EDITOR || "vim";

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      CONFIG_FILE,
      "utf-8"
    );
  }

  spawn(editor, [CONFIG_FILE], { stdio: "inherit" });
} else if (TYPE === "cache") {
  cache({ calendar: loadConfig().calendar });
} else {
  const COMMANDS = {
    habit,
    projects,
    stats,
    tags
  };

  const { render, calculate } = COMMANDS[TYPE];
  const { calendar } = loadConfig();

  const events = getParsedEvents({ calendar });

  const renderData = calculate({
    events,
    calendar,
    ...args
  });

  console.log(render(renderData));
}
