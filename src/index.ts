import { createServer } from './server.js';

const baseDir = process.argv[2];

const server = createServer({
  baseDir, 
  maxItems: 1000,
});

server.listen(4000, () => {
  console.log('Server is listening on port 4000');
});
