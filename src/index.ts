import { createServer } from './server.js';

const baseDir = process.argv[2];
const port = process.argv[3] ?? 4000;

const server = createServer({
  baseDir, 
  maxItems: 1000,
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
