import { Server } from 'socket.io';
import teamVoice from './team-voice.js'

const cors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, cors);
  const teamVoiceIo = io.of('/team-voice-chat');
  teamVoiceIo.on('connection', (socket) => {
    teamVoice(io, socket);
  });
}