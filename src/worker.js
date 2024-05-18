import mediasoup from "mediasoup";

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

class Worker {
  static worker;

  static async init() {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: 2000,
      rtcMaxPort: 2100,
    });

    this.worker.on("died", (err) => {
      console.error(err);
    });
  }

  static async createRouter() {
    return await this.worker.createRouter({ mediaCodecs });
  }
}

export default Worker;
