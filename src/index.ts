#!/usr/bin/env node

import { createServer } from './server.js';
import parser from 'yargs-parser';
import detect from 'detect-port';
import boxen from 'boxen';

const argv = parser(process.argv.slice(2));
const port = argv.port || 4000;

const freePort = await detect(port);
const version = process.env.npm_package_version || 'unknown';

const server = createServer({
  serverUrl: `http://localhost:${freePort}`,
  version,
  collections: {
    baseDir: argv._[0]?.toString(),
    maxItems: 1000,
  },
});

server.listen(freePort, () => {
  console.log(
    boxen(
      `jsonhost v${version}\n\n` + 
      (freePort !== port
        ? `WARNING: Port ${port} is already in use, using port ${freePort} instead\n\n`
        : ''
      ) +
      `Server is running on http://localhost:${freePort}`,
      {
        padding: 1,
        margin: 1,
        borderColor: 'green',
      },
    ),
  );
});
