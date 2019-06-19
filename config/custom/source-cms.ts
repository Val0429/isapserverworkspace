export interface ISnapshot {
    intervalSecond: number;
    bufferCount: number;
    isLive: boolean;
}

export interface Config {
    snapshot: ISnapshot;
}

let config: Config = {
    snapshot: {
        intervalSecond: 300,
        bufferCount: 10,
        isLive: true,
    },
};
export default config;
