export interface Config {
    enable: boolean;
    bufferCount: number;
    host: string;
    port: number;
    email: string;
    password: string;
}

var config: Partial<Config> = {
    enable: false,
    bufferCount: 10,
    host: '',
    port: 25,
    email: '',
    password: '',
};
export default config;
