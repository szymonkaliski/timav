#!/usr/bin/env node

const yargs = require("yargs");

const avg = require("./avg");
const balance = require("./balance");
const cache = require("./cache");
const habit = require("./habit");
const projects = require("./projects");
const stats = require("./stats");

const args = yargs
  .command("cache", "cache updated events")
  .command("stats", "show basic stats")
  .command("avg [query]", "average time for [query]", yargs => {
    yargs.option("t", {
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

const COMMANDS = {
  cache: () => {
    cache({
      calendar: args.calendar
    });
  },

  stats: () => {
    stats();
  },

  avg: () => {
    avg({ query: args.query, timeframe: args.t });
  },

  balance: () => {
    balance({ query: args.query, n: args.n });
  },

  habit: () => {
    habit({ query: args.query });
  },

  projects: () => {
    projects({ query: args.query, n: args.n });
  }
};

COMMANDS[TYPE]();
