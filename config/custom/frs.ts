export interface IAnalysisConfig {
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
    specialScoreForUnRecognizedFace: number;
    throttleKeepSameFaceSeconds: number;
}

export interface IManageCinfig {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface Config {
    analysis: IAnalysisConfig;
    manage: IManageCinfig;
}

let config: Config = {
    analysis: {
        ip: '172.16.10.155',
        port: 8088,
        wsport: 7077,
        account: 'Min',
        password: '1',
        specialScoreForUnRecognizedFace: 0.7,
        throttleKeepSameFaceSeconds: 15,
    },
    manage: {
        protocol: 'http',
        ip: '172.16.10.155',
        port: 80,
        account: 'Min',
        password: '1',
    },
};
export default config;
