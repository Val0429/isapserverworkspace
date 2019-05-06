export interface IAnalysisConfig {
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
}

export interface IManageCinfig {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IFRSR {
    analysis: IAnalysisConfig;
    manage: IManageCinfig;
}
