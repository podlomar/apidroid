#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname } from './dirname.js';
import { createServer } from './server.js';
import parser from 'yargs-parser';
import detect from 'detect-port';
import boxen from 'boxen';

const argv = parser(process.argv.slice(2));
const port = argv.port || 4000;

const freePort = await detect(port);
const packageJson = JSON.parse(
  readFileSync(dirname('package.json'), 'utf-8')
);
const version = packageJson.version;

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
      `apidroid v${version}\n\n` + 
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
