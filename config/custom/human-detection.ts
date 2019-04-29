export interface IImage {
    width: number;
    height: number;
    isFill: boolean;
    isTransparent: boolean;
}

export interface IRectangle {
    lineWidth: number;
    color: string;
    isFill: boolean;
}

export interface IOutput {
    image: IImage;
    rectangle: IRectangle;
}

export interface ICMS {
    intervalSecond: number;
    bufferCount: number;
    isLive: boolean;
}

export interface Config {
    productId: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    target_score: number;
    bufferCount: number;
    cms: ICMS;
    output: IOutput;
}

let config: Config = {
    productId: '00111',
    protocol: 'http',
    ip: '127.0.0.1',
    port: 8000,
    target_score: 0.5,
    bufferCount: 5,
    cms: {
        intervalSecond: 300,
        bufferCount: 5,
        isLive: true,
    },
    output: {
        image: {
            width: 640,
            height: 480,
            isFill: false,
            isTransparent: false,
        },
        rectangle: {
            lineWidth: 7,
            color: 'red',
            isFill: false,
        },
    },
};
export default config;
