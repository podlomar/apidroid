import { createServer } from './server.js';

const baseDir = process.argv[2] ?? process.cwd();

const server = createServer(baseDir);

server.listen(4000, () => {
  console.log('Server is listening on port 4000');
});
