var config: Config = {
    ip: "172.16.10.74",
    port: 80,
    account: "Min",
    password: "1"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}