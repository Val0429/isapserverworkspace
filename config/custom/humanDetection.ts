export interface ICameraSource {
    nvr: number;
    channel: number[];
}

export interface IYolo {
    path: string;
    filename: string;
    target_score: number;
    isEnable: boolean;
}

export interface IIsap {
    ip: string;
    port: number;
    target_score: number;
    isEnable: boolean;
}

export interface IOutput {
    path: string;
    width: number;
    height: number;
    lineWidth: number;
    color: string;
    isFill: boolean;
    quality: number;
}

export interface Config {
    intervalSecond: number;
    cameraSources: ICameraSource[];
    yolo: IYolo;
    isap: IIsap;
    output: IOutput;
}

let config: Config = {
    intervalSecond: 300,
    cameraSources: [
        {
            nvr: 1,
            channel: [11, 12, 13],
        },
    ],
    yolo: {
        path: './workspace/custom/assets/yolo3',
        filename: 'darknet.exe',
        target_score: 0.2,
        isEnable: true,
    },
    isap: {
        ip: '172.16.10.159',
        port: 8000,
        target_score: 0.25,
        isEnable: false,
    },
    output: {
        path: 'humanDetection',
        width: 1280,
        height: 720,
        lineWidth: 13,
        color: 'red',
        isFill: false,
        quality: 0.5,
    },
};
export default config;
