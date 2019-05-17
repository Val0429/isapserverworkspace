export interface ISg {
    enable: boolean;
    url: string;
    account: string;
    password: string;
}

export interface Config {
    bufferCount: number;
    sg: ISg;
}

var config: Partial<Config> = {
    bufferCount: 10,
    sg: {
        enable: false,
        url: '',
        account: '',
        password: '',
    },
};
export default config;
