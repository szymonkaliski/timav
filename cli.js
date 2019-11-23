#!/usr/bin/env node

const yargs = require("yargs");

const cache = require("./cache");
const balance = require("./balance");
const stats = require("./stats");
const avg = require("./avg");

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
  }
};

COMMANDS[TYPE]();
