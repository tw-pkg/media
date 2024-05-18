class Room {
  constructor(router) {
    this.router = router;
    this.peers = new Map();
  }

  joinPeer(peer) {
    this.peers.set(peer.puuid, peer);
  }

  findPeer(puuid) {
    this.peers.get(puuid);
  }

  findProducers(excludedSocketId) {
    return Array.from(this.peers.values()).filter(
      peer => peer.socketId !== excludedSocketId && peer.isProducer()
    )
  }
}

export default Room