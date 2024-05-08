class Peer {
  constructor(socketId, summoner) {
    this.socketId = socketId;
    this.puuid = summoner.puuid;
    this.producerTransport = null;
    this.consumerTransports = new Map();
    this.producer = null;
    this.consumers = new Map();
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

  hasProducer() {
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
}

export default Peer;