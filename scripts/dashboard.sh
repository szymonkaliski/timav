#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/../" || exit 1


./cli.js -c Tracking stats

printf "\n@work:\n"
printf "\nNow: "
./cli.js -c Tracking avg @work -t today
printf "Avg: "
./cli.js -c Tracking avg @work -t year
printf "\n"
./cli.js -c Tracking balance @work -n 4

printf "\n@personal:\n"
printf "\nNow: "
./cli.js -c Tracking avg @personal -t today
printf "Avg: "
./cli.js -c Tracking avg @personal -t year
printf "\n"
./cli.js -c Tracking balance @personal -n 4

printf "\n"

./cli.js -c Tracking habit @health
./cli.js -c Tracking habit @personal
./cli.js -c Tracking habit @journal
./cli.js -c Tracking habit @language

printf "\n"

./cli.js -c Tracking projects -n 10
