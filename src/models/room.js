class Room {
  constructor(roomId, router) {
    this.id = roomId;
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
      (peer) => peer.socketId !== excludedSocketId && peer.isProducer(),
    );
  }

  hasPeer(socketId) {
    return this.peers.has(socketId);
  }

  leavePeer(disconnectedPeer) {
    Array.from(this.peers.values())
      .filter((peer) => peer.isSame(disconnectedPeer.socketId))
      .forEach((peer) => {
        const consumer = peer.findConsumer(disconnectedPeer.producer.id);
        consumer?.close();
        peer.deleteConsumer(disconnectedPeer.producer.id);

        const consumerTransport = peer.findConsumerTransport(
          disconnectedPeer.producer.id,
        );
        consumerTransport?.close();
        peer.deleteConsumerTransport(disconnectedPeer.producer.id);
      });

    this.peers.delete(disconnectedPeer.socketId);
  }

  isEmpty() {
    return this.peers.size === 0;
  }

  remove() {
    this.router.close();
  }
}

export default Room;
