import { ICameraSource } from '../../custom/models';

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

export interface Config {
    intervalSecond: number;
    cameraSources: ICameraSource[];
    yolo: IYolo;
    isap: IIsap;
}

let config: Config = {
    intervalSecond: 300,
    cameraSources: [
        {
            nvr: 1,
            channel: [1, 2],
        },
    ],
    yolo: {
        path: 'C:/Users/Min.Hsieh/Desktop/yolo3',
        filename: 'darknet.exe',
        target_score: 0.2,
        isEnable: true,
    },
    isap: {
        ip: '172.16.10.159',
        port: 8000,
        target_score: 0.25,
        isEnable: true,
    },
};
export default config;