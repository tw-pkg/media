class Rooms {
    static rooms = new Map();

    static findBy(roomName) {
        return this.rooms.get(roomName);
    }

    static save(roomName, room) {
        this.rooms.set(roomName, room);
    }
}

export default Rooms