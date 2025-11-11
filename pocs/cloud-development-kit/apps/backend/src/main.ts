
import { createServer } from 'http';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('backend up'));
app.get('/hello', (req, res) => res.json({ hello: 'world from backend' }));

// simple proxy to AppSync (for local demo)
app.post('/graphql', async (req, res) => {
  const url = process.env.APPSYNC_URL;
  if (!url) return res.status(500).send('no APPSYNC_URL');
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
  const j = await r.text();
  res.set('content-type', 'application/json').send(j);
});

createServer(app).listen(3001, () => console.log('Backend listening on 3001'));
