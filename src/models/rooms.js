import log from "../logger.js";

class Rooms {
  static rooms = new Map();

  static findBy(roomId) {
    return this.rooms.get(roomId);
  }

  static save(roomId, room) {
    this.rooms.set(roomId, room);
  }

  static findBySocketId(disconnectedSocketId) {
    return Array.from(this.rooms.values()).find((room) =>
      room.hasPeer(disconnectedSocketId),
    );
  }

  static remove(room) {
    if (room.isEmpty()) {
      room.remove();
      this.rooms.delete(room.id);
      log("방 폭파");
    }
  }
}

export default Rooms;
