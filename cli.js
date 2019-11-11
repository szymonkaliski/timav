#!/usr/bin/env node

const yargs = require("yargs");

const cache = require("./cache");
const stats = require("./stats");

const args = yargs
  .command("cache", "cache updated events")
  .command("stats", "show basic stats")
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
  }
};

COMMANDS[TYPE]();
