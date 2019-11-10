#!/usr/bin/env node

const yargs = require("yargs");

const cache = require("./cache");

const args = yargs
  .command("cache", "cache updated events")
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
  }
};

COMMANDS[TYPE]();
