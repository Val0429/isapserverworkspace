var config: Config = {
    ip: "172.16.10.109",
    port: 9090,
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