#!/usr/bin/env node

const envPaths = require("env-paths");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const yargs = require("yargs");
const { spawn } = require("child_process");

const avg = require("./avg");
const balance = require("./balance");
const cache = require("./cache");
const habit = require("./habit");
const projects = require("./projects");
const stats = require("./stats");

const CONFIG_PATH = envPaths("timav").config;
const CONFIG_FILE = path.join(CONFIG_PATH, "config.json");
const DEFAULT_CONFIG = {};

mkdirp(CONFIG_PATH);

const { getParsedEvents } = require("./utils/paths");

const args = yargs
  .command("config", "open configuration file")
  .command("cache", "cache updated events")
  .command("stats", "show basic stats")
  .command("avg [query]", "average time for [query]", yargs => {
    yargs.option("timeframe", {
      alias: "t",
      describe: "time span for avg",
      default: "today",
      choices: ["today", "week", "month", "year", "all"]
    });
  })
  .command("balance [query]", "balance for [query]", yargs => {
    yargs.option("n", {
      default: 10,
      describe: "show last [n] weeks"
    });
  })
  .command("habit [query]", "habit and streak for [query]")
  .command(
    "projects [query]",
    "show projects matching optional [query]",
    yargs => {
      yargs.option("n", {
        describe: "show last [n] project"
      });
    }
  )
  .command("dashboard", "show dashboard overview")
  .demandCommand(1, "you need to provide a command")
  .help().argv;

const [TYPE] = args._;

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
} else if (TYPE === "dashboard") {
  const events = getParsedEvents({ calendar: loadConfig().calendar });

  console.log(
    stats.render(stats.calculate({ events, calendar: loadConfig().calendar }))
  );

  const renderBalance = query => {
    console.log(`${query}
Now: ${avg.render(avg.calculate({ events, query, timeframe: "today" }))}
Avg: ${avg.render(avg.calculate({ events, query, timeframe: "year" }))}

${balance.render(balance.calculate({ events, query, n: 4 }))}
  `);
  };

  renderBalance("@work");
  renderBalance("@personal");

  ["@health", "@personal", "@journal", "@language"].forEach(query => {
    console.log(habit.render(habit.calculate({ events, query })));
  });

  console.log(`
${projects.render(projects.calculate({ events, n: 10 }))}
`);
} else {
  const COMMANDS = { stats, avg, balance, habit, projects };

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
