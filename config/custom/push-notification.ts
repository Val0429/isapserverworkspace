export interface IFcm {
    serverKey: string;
    collapseKey: string;
}

export interface IApn {
    key: string;
    keyId: string;
    teamId: string;
    topic: string;
}

export interface Config {
    enable: boolean;
    bufferCount: number;
    fcm: IFcm;
    apn: IApn;
}

let config: Config = {
    enable: false,
    bufferCount: 10,
    fcm: {
        serverKey: '',
        collapseKey: '',
    },
    apn: {
        key: '',
        keyId: '',
        teamId: '',
        topic: '',
    },
};
export default config;
