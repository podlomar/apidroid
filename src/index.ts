#!/usr/bin/env node

import { createServer } from './server.js';
import parser from 'yargs-parser';

const argv = parser(process.argv.slice(2));
const port = argv.port || 4000;

const server = createServer({
  baseDir: argv._[0]?.toString(),
  maxItems: 1000,
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
