export type Security = "None" | "SSL" | "TLS";

var config: Config = {
    ip: "172.16.10.31",
    port: 8088,
    account: "UserDos",
    password: "123456",
    security: "None"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
    security: Security;
}