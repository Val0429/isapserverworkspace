var config: Config = {
    ip: "172.16.10.90",
    port: 8080,
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