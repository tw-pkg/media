class Room {
  constructor(router) {
    this.router = router;
    this.peers = new Map();
  }

  joinPeer(peer) {
    this.peers.set(peer.socketId, peer);
  }

  findPeer(socketId) {
    return this.peers.get(socketId);
  }

  findProducers(excludedSocketId) {
    return Array.from(this.peers.values()).filter(
      peer => peer.socketId !== excludedSocketId && peer.isProducer()
    )
  }

  hasPeer(socketId) {
    return this.peers.has(socketId);
  }

  leavePeer(disconnectedPeer) {
    Array.from(this.peers.values())
        .filter(peer => peer.socketId !== disconnectedPeer.socketId)
        .forEach((peer) => {
          const consumer = peer.findConsumer(disconnectedPeer.producer.id);
          if(consumer) {
            consumer.close();
          }
          peer.deleteConsumer(disconnectedPeer.producer.id);

          const consumerTransport = peer.findConsumerTransport(disconnectedPeer.producer.id);
          if(consumerTransport) {
            consumerTransport.close();
          }
          peer.deleteConsumerTransport(disconnectedPeer.producer.id);
    });

    this.peers.delete(disconnectedPeer.socketId);
  }
}

export default Room