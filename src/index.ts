#!/usr/bin/env node

import { createServer } from './server.js';
import parser from 'yargs-parser';
import detect from 'detect-port';

const argv = parser(process.argv.slice(2));
const port = argv.port || 4000;

const server = createServer({
  baseDir: argv._[0]?.toString(),
  maxItems: 1000,
});

const freePort = await detect(port);

if (freePort !== port) {
  console.log(`WARNING: Port ${port} is already in use, using port ${freePort} instead`);
}

server.listen(freePort, () => {
  console.log(`Server is running on http://localhost:${freePort}`);
});
