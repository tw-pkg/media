import Peer from "./models/peer";
import Room from "./models/room";
import Worker from "./worker";

export default (io, socket) => {
  socket.on('team-join-room', async (data, callback) => {
    const { roomName, summoner } = data;
    const room = await createRoom(roomName);
    const peer = new Peer(socket.id, summoner);
    room.joinPeer(peer);

    socket.join(roomName);
    socket.roomName = roomName;

    callback({
      rtpCapabilities: room.router.rtpCapabilities
    });
  });

  async function createRoom(roomName) {
    const room = Room.findBy(roomName);

    if (room) {
      return room;
    }

    const router = await Worker.createRouter();
    const newRoom = new Room(router);
    Room.save(roomName, newRoom);
    return newRoom;
  }

  socket.on('create-producer-transport', async (data, callback) => {
    const { puuid } = data;
    const room = Room.findBy(socket.roomName);
    const peer = room.findPeer(puuid);
    const transport = await createTransport(room.router);
    peer.setProducerTransport(transport);

    const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
    callback({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters
    });
  });

  socket.on('create-consumer-transport', async (data) => {
    const { puuid, remoteProducerId } = data;
    const room = Room.findBy(socket.roomName);
    const peer = room.findPeer(puuid);
    const transport = await createTransport(room.router);
    peer.addConsumerTransport(remoteProducerId, transport);

    const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
    socket.emit('create-consumer-transport', {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });
  })

  async function createTransport(router) {
    const options = {
      listenIps: [
        {
          ip: LISTENIP,
          announcedIp: null,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };
    
    try {
      return await router.createWebRtcTransport(options);
    } catch(err) {
      throw new Error(err);
    }
  }

  socket.on('transport-connect', (data) => {
    const { puuid, dtlsParameters } = data;
    const room = Room.findBy(socket.roomName);
    const peer = room.findPeer(puuid);
    const transport = peer.findProducerTransport();

    transport.conect({ dtlsParameters });
  });

  socket.on('transport-produce', async (data, callback) => {
    const { puuid, kind, rtpParameters } = data;
    const room = Room.findBy(socket.roomName);
    const peer = room.findPeer(puuid);
    const transport = peer.findProducerTransport();

    const producer = await transport.produce({ kind, rtpParameters });
    peer.setProducer(producer);

    informNewProducer()
  })

  function informNewProducer() {
    //todo
  }
}