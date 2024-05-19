import Peer from "./models/peer.js";
import Rooms from "./models/rooms.js";
import Room from "./models/room.js";
import Worker from "./worker.js";
import log from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

const LISTENIP = process.env.LISTENIP;

export default (io, socket) => {
  socket.on("team-join-room", async (data, callback) => {
    const { roomId, puuid } = data;
    const room = await createRoom(roomId);
    const peer = new Peer(socket.id, puuid);
    room.joinPeer(peer);

    socket.join(roomId);
    log(`${puuid} 팀보이스 입장`);

    callback({
      rtpCapabilities: room.router.rtpCapabilities,
    });
  });

  async function createRoom(roomId) {
    const room = Rooms.findBy(roomId);

    if (room) {
      return room;
    }

    const router = await Worker.createRouter();
    const newRoom = new Room(roomId, router);
    Rooms.save(roomId, newRoom);
    return newRoom;
  }

  socket.on("create-producer-transport", async (data, callback) => {
    const { roomId } = data;
    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = await createTransport(room.router);
    peer.setProducerTransport(transport);
    log(`${peer.puuid} producer transport 생성`);

    const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
    callback({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });
  });

  socket.on("create-consumer-transport", async (data, callback) => {
    const { roomId, remoteProducerId } = data;
    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = await createTransport(room.router);
    peer.addConsumerTransport(remoteProducerId, transport);
    log(`${peer.puuid} consumer transport 생성`);

    const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
    callback({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });
  });

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
    } catch (err) {
      throw new Error(err);
    }
  }

  socket.on("transport-connect", async (data) => {
    const { roomId, dtlsParameters } = data;
    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = peer.findProducerTransport();
    log(`${peer.puuid} producer transport 연결`);

    await transport.connect({ dtlsParameters });
  });

  socket.on("transport-produce", async (data, callback) => {
    const { roomId, kind, rtpParameters } = data;
    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = peer.findProducerTransport();

    const producer = await transport.produce({ kind, rtpParameters });
    peer.setProducer(producer);
    log(`${peer.puuid} producer 생성`);

    const producers = room.findProducers(peer.socketId);
    informNewProducer(producers, peer);
    log(`${peer.puuid} inform new producer`);

    callback({
      id: producer.id,
      existProducer: producers.length > 0,
    });
  });

  function informNewProducer(producers, peer) {
    producers.forEach((producer) => {
      io.to(producer.socketId).emit("new-producer", {
        id: peer.producer.id,
        puuid: peer.puuid,
      });
    });
  }

  socket.on("get-producers", (data, callback) => {
    const { roomId } = data;
    const room = Rooms.findBy(roomId);
    const producers = room.findProducers(socket.id).map((producer) => {
      return {
        id: producer.id,
        puuid: producer.puuid,
      };
    });
    log("get producers");

    callback(producers);
  });

  socket.on("transport-recv-connect", async (data) => {
    const { roomId, dtlsParameters, remoteProducerId } = data;

    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);
    log(`${peer.puuid} consumer transport 연결`);

    await transport.connect({ dtlsParameters });
  });

  socket.on("consume", async (data, callback) => {
    const { roomId, rtpCapabilities, remoteProducerId } = data;

    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    if (
      room.router.canConsume({ producerId: remoteProducerId, rtpCapabilities })
    ) {
      const consumer = await transport.consume({
        producerId: remoteProducerId,
        rtpCapabilities,
        paused: true,
      });

      peer.addConsumer(remoteProducerId, consumer);
      log(`${peer.puuid} consumer 생성`);

      const { id, kind, rtpParameters } = consumer;
      callback({
        params: {
          id,
          producerId: remoteProducerId,
          kind,
          rtpParameters,
          serverConsumerId: id,
        },
      });
    }
  });

  socket.on("consumer-resume", async (data) => {
    const { roomId, remoteProducerId } = data;

    const room = Rooms.findBy(roomId);
    const peer = room.findPeer(socket.id);
    const consumer = peer.findConsumer(remoteProducerId);
    log(peer.puuid + " consumer resume");

    await consumer.resume();
  });

  socket.on("mic-visualizer", (data) => {
    io.emit("mic-visualizer", data);
  });

  socket.on("mic-volume", (data) => {
    socket.broadcast.emit("mic-volumn", data);
  });

  socket.on("disconnect", () => {
    const room = Rooms.findBySocketId(socket.id);

    if (room) {
      const peer = room.findPeer(socket.id);

      socket.broadcast.emit("inform-exit-in-game", {
        puuid: peer.puuid,
      });

      room.leavePeer(peer);
      peer.closeAll();
      log(`${peer.puuid} 연결종료`);
    }

    Rooms.remove(room);
  });
};
