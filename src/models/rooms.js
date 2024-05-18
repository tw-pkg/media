class Rooms {
    static rooms = new Map();

    static findBy(roomId) {
        return this.rooms.get(roomId);
    }

    static save(roomId, room) {
        this.rooms.set(roomId, room);
    }

    static findBySocketId(disconnectedSocketId) {
        return Array.from(this.rooms.values()).find(room => room.hasPeer(disconnectedSocketId));
    }
}

export default Rooms