#!/usr/bin/env node

const yargs = require("yargs");

const avg = require("./avg");
const balance = require("./balance");
const cache = require("./cache");
const habit = require("./habit");
const projects = require("./projects");
const stats = require("./stats");

const { getParsedEvents } = require("./utils/paths");

const args = yargs
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
  .demandCommand(1, "you need to provide a command")
  .option("calendar", {
    alias: "c",
    demandOption: true
  })
  .help().argv;

const [TYPE] = args._;

if (TYPE === "cache") {
  cache({ calendar: args.calendar });
} else {
  const COMMANDS = { stats, avg, balance, habit, projects };

  const { render, calculate } = COMMANDS[TYPE];
  render(calculate({ events: getParsedEvents(), ...args }));
}
