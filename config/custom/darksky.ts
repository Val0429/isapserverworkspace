export interface Config {
    secretKey: string;
    bufferCount: number;
    hourlyFrequency: number;
}

let config: Config = {
    secretKey: '',
    bufferCount: 10,
    hourlyFrequency: 8,
};
export default config;
