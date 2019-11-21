#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/../" || exit 1


./cli.js -c Tracking stats
printf "\n@work:\n"
./cli.js -c Tracking avg @work
printf "\n@personal:\n"
./cli.js -c Tracking avg @personal
