import { Server } from 'socket.io';
import { connect, manageTeamVoice } from './team-voice.js'

const cors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, cors);
  onTeamVoice(io)
}

function onTeamVoice(io) {
  const teamVoiceIo = io.of('/team-voice-chat');
  const teamVoiceManageIo = io.of('/team-voice-chat/manage');

  teamVoiceIo.on('connection', (socket) => {
    connect(teamVoiceIo, socket);
  });

  teamVoiceManageIo.on('connection', (socket) => {
    manageTeamVoice(teamVoiceManageIo, socket);
  })
}