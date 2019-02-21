export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}

let config: Config = {
    ip: '172.16.10.31',
    port: 8088,
    account: 'Admin',
    password: '123456',
};
export default config;
