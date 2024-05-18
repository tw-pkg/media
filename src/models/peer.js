import socket from "../socket.js";

class Peer {
  constructor(socketId, puuid) {
    this.socketId = socketId;
    this.puuid = puuid;
    this.producerTransport = null;
    this.consumerTransports = new Map();
    this.producer = null;
    this.consumers = new Map();
  }

  isSame(socketId) {
    return this.socketId === socketId;
  }

  setProducerTransport(transport) {
    this.producerTransport = transport;
  }

  addConsumerTransport(producerId, transport) {
    this.consumerTransports.set(producerId, transport);
  }

  findProducerTransport() {
    return this.producerTransport;
  }

  setProducer(producer) {
    this.producer = producer;
  }

  isProducer() {
    return this.producer !== null;
  }

  findConsumerTransport(producerId) {
    return this.consumerTransports.get(producerId);
  }

  addConsumer(producerId, consumer) {
    this.consumers.set(producerId, consumer);
  }

  findConsumer(producerId) {
    return this.consumers.get(producerId);
  }

  deleteConsumer(producerId) {
    this.consumers.delete(producerId);
  }

  deleteConsumerTransport(producerId) {
    this.consumerTransports.delete(producerId);
  }

  closeAll() {
    this.producer?.close();
    this.producerTransport?.close();
    Array.from(this.consumers.values()).forEach((consumer) => consumer.close());
    Array.from(this.consumerTransports.values()).forEach((transport) =>
      transport.close(),
    );
  }
}

export default Peer;
