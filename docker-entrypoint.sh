#!/bin/sh
set -e
node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma
node prisma/seed.mjs
exec "$@"
