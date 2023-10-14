import { promises as fs } from 'fs';
import express from 'express';

const app = express();

app.get(/(\/[a-z][a-z_\-]*)+\/[0-9]+/, async (req, res) => {
  const filePath = req.path.slice(0, req.path.lastIndexOf('/'));
  const id = Number(req.path.slice(req.path.lastIndexOf('/') + 1));
  
  const content = await fs.readFile(`.${filePath}.json`, 'utf-8');
  const json = JSON.parse(content);

  const item = json.find((item: any) => item.id === id);
  res.json(item);
});

app.listen(4000, () => {
  console.log('Server běží na portu 4000');
});
