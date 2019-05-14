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
        enable: true,
        url: "https://mx.fortdigital.net/http/send-message",
        account: "test60",
        password: "test60"
    }
};
export default config;
