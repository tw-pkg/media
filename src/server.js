import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import socket from './socket.js';

const app = express();
const port = 8080;
app.use(cors());

const server = createServer(app);

socket(server);

server.listen(port, () => {
  console.log('start media server');
});