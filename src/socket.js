import { Server } from "socket.io";
import connectTeamVoice from "./team-voice.js";

const cors = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, cors);
  onTeamVoice(io);
};

function onTeamVoice(io) {
  const teamVoiceIo = io.of("/team-voice-chat");

  teamVoiceIo.on("connection", (socket) => {
    connectTeamVoice(teamVoiceIo, socket);
  });
}
