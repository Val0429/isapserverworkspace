export interface Config {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

let config: Config = {
    protocol: "http",
    ip: "172.16.10.178",
    port: 8100,
    account: "Admin",
    password: "123456"
};
export default config;
