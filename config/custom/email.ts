export interface Config {
    enable: boolean;
    bufferCount: number;
    host: string;
    port: number;
    email: string;
    password: string;
}

var config: Partial<Config> = {
    enable: true,
    bufferCount: 10,
    host: "mail.isapsolution.com",
    port: 25,
    email: "services@isapsolution.com",
    password: "Az123456"
};
export default config;
