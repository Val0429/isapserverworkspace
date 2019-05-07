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
        ip: '127.0.0.1',
        port: 80,
        wsport: 80,
        account: '',
        password: '',
        specialScoreForUnRecognizedFace: 0.7,
        throttleKeepSameFaceSeconds: 15,
    },
    manage: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        account: '',
        password: '',
    },
};
export default config;
