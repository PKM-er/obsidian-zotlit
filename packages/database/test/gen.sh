#!/bin/bash

set -eo pipefail

ZOTERO_VERSION=7.0.15
BBT_VERSION=7.0.26
DRIZZLE_DIR=./drizzle

rm -r $DRIZZLE_DIR

pnpm drizzle-kit pull --dialect sqlite --out $DRIZZLE_DIR/zotero \
  --url "file:$PWD/test/zotero-$ZOTERO_VERSION.sqlite"

pnpm drizzle-kit pull --dialect sqlite --out $DRIZZLE_DIR/bbt \
  --url "file:$PWD/test/better-bibtex-$BBT_VERSION.sqlite"

rm -r $DRIZZLE_DIR/*/meta $DRIZZLE_DIR/*/*.sql

pnpm biome check --write $DRIZZLE_DIR/*/*.ts