var config: Config = {
    ip: "172.16.10.31",
    port: 8088,
    account: "val",
    password: "123456"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}