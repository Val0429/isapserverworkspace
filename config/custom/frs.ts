var config: Config = {
    ip: "172.16.10.31",
    port: 8088,
    wsport: 7077,
    account: "AdminVal",
    password: "123456"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
}