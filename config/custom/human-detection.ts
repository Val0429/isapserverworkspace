export interface IOutput {
    width: number;
    height: number;
    lineWidth: number;
    color: string;
    isFill: boolean;
    quality: number;
}

export interface Config {
    productId: string;
    intervalSecond: number;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    target_score: number;
    output: IOutput;
}

let config: Config = {
    productId: "00111",
    intervalSecond: 300,
    protocol: "http",
    ip: "172.16.10.21",
    port: 8000,
    target_score: 0.25,
    output: {
        width: 640,
        height: 480,
        lineWidth: 7,
        color: "red",
        isFill: false,
        quality: 0.5
    }
};
export default config;
