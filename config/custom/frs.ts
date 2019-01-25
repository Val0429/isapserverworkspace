export interface Config {
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
}

let config: Config = {
    ip: '172.16.10.31',
    port: 8088,
    wsport: 7077,
    account: 'Min',
    password: '1',
};
export default config;
