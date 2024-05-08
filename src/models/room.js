class Room {
  static rooms = new Map();
  
  constructor(router) {
    this.router = router;
    this.peers = new Map();
  }

  static findBy(roomName) {
    return this.rooms.get(roomName);
  }

  static save(roomName, room) {
    this.rooms.set(roomName, room);
  }

  joinPeer(peer) {
    this.peers.set(peer.puuid, peer);
  }

  findPeer(puuid) {
    this.peers.get(puuid);
  }

  findProducers(excludedSocketId) {
    return Array.from(this.peers.values()).filter(
      peer => peer.socketId !== excludedSocketId && peer.hasProducer()
    )
  }
}

export default Room;