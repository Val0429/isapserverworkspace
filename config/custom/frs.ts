var config: Config = {
    ip: "172.16.10.49",
    port: 8088,
    wsport: 7077,
    account: "valadmin",
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