class Rooms {
    static rooms = new Map();

    static findBy(roomId) {
        return this.rooms.get(roomId);
    }

    static save(roomId, room) {
        this.rooms.set(roomId, room);
    }
}

export default Rooms