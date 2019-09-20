var config: Config = {
    ip: "172.16.10.21",
    port: 6067,
    account: "Admin",
    password: "123456"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}