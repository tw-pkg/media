import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import socket from './socket.js';
import Worker from './worker.js';

const app = express();
const port = 8080;
app.use(cors());

const server = createServer(app);

Worker.init().then(() => {
  socket(server);
})

server.listen(port, () => {
  console.log('start media server');
});