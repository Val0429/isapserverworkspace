export interface Config {
    bufferCount: number;
    enable: boolean;
    url: string;
    account: string;
    password: string;
}

let config: Config = {
    bufferCount: 10,
    enable: false,
    url: '',
    account: '',
    password: '',
};
export default config;
