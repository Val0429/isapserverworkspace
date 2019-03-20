export interface Config {
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
    specialScoreForUnRecognizedFace: number;
    throttleKeepSameFaceSeconds: number;
}

let config: Config = {
    ip: '172.16.10.31',
    port: 8088,
    wsport: 7077,
    account: 'Min',
    password: '1',
    specialScoreForUnRecognizedFace: 0.7,
    throttleKeepSameFaceSeconds: 15,
};
export default config;
