#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1

NODE=/Users/szymon/.nvm/versions/node/v12*/bin/node
$NODE ../cli.js cache -c Tracking
