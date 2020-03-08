#!/usr/bin/env node

const fs = require("fs");
const yargs = require("yargs");
const { spawn } = require("child_process");

const cache = require("./cache");
const habit = require("./habit");
const projects = require("./projects");
const stats = require("./stats");
const tags = require("./tags");

const {
  CONFIG_FILE_PATH,
  CONFIG_PATH,
  hasConfigFile,
  hasCredentials,
  getParsedEvents
} = require("./utils/paths");

const { loadConfig } = require("./utils/config");

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
const COMMANDS = { habit, projects, stats, tags };

if (TYPE === "config") {
  const editor = process.env.EDITOR || "vim";

  if (!hasConfigFile()) {
    fs.writeFileSync(
      JSON.stringify({ calendar: "" }, null, 2),
      CONFIG_FILE_PATH,
      "utf-8"
    );
  }

  spawn(editor, [CONFIG_FILE_PATH], { stdio: "inherit" });
} else if (!hasCredentials()) {
  console.log(
    `
No credentials.json found!

1. create one here: https://console.developers.google.com/ for a CLI project with access to google calendar
2. save it to ${CONFIG_PATH}/credentials.json
`
  );

  process.exit(1);
} else if (TYPE === "cache") {
  cache({ calendar: loadConfig().calendar });
} else if (COMMANDS[TYPE]) {
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
