export interface Config {
    secretKey: string;
    bufferCount: number;
}

let config: Config = {
    secretKey: '',
    bufferCount: 10,
};
export default config;
