class Room {
  static rooms = new Map();
  
  constructor(router) {
    this.router = router;
    this.peer = new Map();
  }

  static findBy(roomName) {
    return this.rooms.get(roomName);
  }

  static save(roomName, room) {
    this.rooms.set(roomName, room);
  }

  joinPeer(peer) {
    this.peer.set(peer.puuid, peer);
  }

  findPeer(puuid) {
    this.peer.get(puuid);
  }
}

export default Room;