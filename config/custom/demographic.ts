export interface ICameraSource {
    nvr: number;
    channel: number[];
}

export interface IIsap {
    ip: string;
    port: number;
    margin: number;
    isEnable: boolean;
}

export interface IOutput {
    path: string;
    size: number;
    level: number;
}

export interface Config {
    intervalSecond: number;
    source: 'frs' | 'cms';
    channels: string[];
    ageRange: string;
    cameraSources: ICameraSource[];
    isap: IIsap;
    output: IOutput;
}

let config: Config = {
    intervalSecond: 1,
    source: 'frs',
    channels: ['Camera_01_01'],
    ageRange: '0-20-20-20',
    cameraSources: [
        {
            nvr: 7,
            channel: [18, 19],
        },
    ],
    isap: {
        ip: '172.16.10.159',
        port: 8008,
        margin: 0.9,
        isEnable: true,
    },
    output: {
        path: 'images/demographic',
        size: 200,
        level: 9,
    },
};
export default config;
