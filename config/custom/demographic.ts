export interface ICameraSource {
    nvr: number;
    channel: number[];
}

export interface IAzure {
    key: string;
    isEnable: boolean;
}

export interface IIsap {
    ip: string;
    port: number;
    margin: number;
    isEnable: boolean;
}

export interface IOutput {
    path: string;
}

export interface Config {
    cameraSources: ICameraSource[];
    azure: IAzure;
    isap: IIsap;
    output: IOutput;
}

let config: Config = {
    cameraSources: [
        {
            nvr: 7,
            channel: [18, 19],
        },
    ],
    azure: {
        key: '',
        isEnable: true,
    },
    isap: {
        ip: '172.16.10.159',
        port: 8000,
        margin: 0.25,
        isEnable: false,
    },
    output: {
        path: 'demographic',
    },
};
export default config;
