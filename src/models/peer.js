class Peer {
  constructor(socketId, summoner) {
    this.socketId = socketId;
    this.puuid = summoner.puuid;
    this.producerTransport = null;
    this.consumerTransports = new Map();
    this.producer = null;
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
}

export default Peer;