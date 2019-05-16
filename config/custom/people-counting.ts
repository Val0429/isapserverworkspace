export interface Config {
    productId: string;
    intervalSecond: number;
    bufferCount: number;
}

let config: Config = {
    productId: '00106',
    intervalSecond: 5,
    bufferCount: 10,
};
export default config;
