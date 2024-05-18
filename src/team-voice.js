import Peer from "./models/peer.js";
import Rooms from "./models/rooms.js";
import Room from "./models/room.js";
import Worker from "./worker.js";

export default (io, socket) => {
  socket.on('team-join-room', async (data, callback) => {
    const { roomName, puuid } = data;
    const room = await createRoom(roomName);
    const peer = new Peer(socket.id, puuid);
    room.joinPeer(peer);

    socket.join(roomName);

    callback({
      rtpCapabilities: room.router.rtpCapabilities
    });
  });

  async function createRoom(roomName) {
    const room = Rooms.findBy(roomName);

    if (room) {
      return room;
    }

    const router = await Worker.createRouter();
    const newRoom = new Room(router);
    Rooms.save(roomName, newRoom);
    return newRoom;
  }

  socket.on('create-producer-transport', async (data, callback) => {
    const { roomName } = data;
    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
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
    const { roomName, remoteProducerId } = data;
    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
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
    const { roomName, dtlsParameters } = data;
    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
    const transport = peer.findProducerTransport();

    transport.connect({ dtlsParameters });
  });

  socket.on('transport-produce', async (data, callback) => {
    const { roomName, kind, rtpParameters } = data;
    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
    const transport = peer.findProducerTransport();

    const producer = await transport.produce({ kind, rtpParameters });
    peer.setProducer(producer);

    const producers = room.findProducers(peer.socketId)
    informNewProducer(producers, peer)

    callback({
      id: producer.id,
      existProducer: producers.length > 0
    })
  })

  function informNewProducer(producers, peer) {
    producers.forEach(producer => {
      io.to(producer.socketId).emit('new-producer', {
        id: peer.producer.id,
        puuid: peer.puuid
      });
    });
  }

  socket.on('get-producers', (data, callback) => {
    const { roomName } = data;
    const room = Rooms.findBy(roomName);
    const producers = room.findProducers(socket.id).map(producer => {
      return {
        id: producer.id,
        puuid: producer.puuid
      }
    });

    callback(producers)
  });

  socket.on('transport-recv-connect', (data) => {
    const { roomName, dtlsParameters, remoteProducerId } = data;

    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    transport.connect({ dtlsParameters });
  });

  socket.on('consume', async (data, callback) => {
    const { roomName, rtpCapabilities, remoteProducerId } = data;

    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    if (room.router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
      const consumer = await transport.consume({
        producerId: remoteProducerId,
        rtpCapabilities,
        paused: true,
      });

      peer.addConsumer(remoteProducerId, consumer);

      const { id, kind, rtpParameters } = consumer;
      callback({
        params: {
          id,
          producerId: remoteProducerId,
          kind,
          rtpParameters,
          serverConsumerId: id
        }
      });
    }
  })

  socket.on('consumer-resume', async (data) => {
    const { roomName, remoteProducerId } = data;
    
    const room = Rooms.findBy(roomName);
    const peer = room.findPeer(socket.id);
    const consumer = peer.findConsumer(remoteProducerId);

    await consumer.resume();
  });

  socket.on('mic-visualizer', (data) => {
    io.emit('mic-visualizer', data);
  })

  socket.on('mic-volume', (data) => {
    socket.broadcast.emit('mic-volumn', data);
  })

  socket.on('disconnect', () => {
  })
}