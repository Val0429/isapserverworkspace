var config: Config = {
    ip: "172.16.10.134",
    port: 80,
    account: "charles",
    password: "123456"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}