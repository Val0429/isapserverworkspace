export interface Config {
    ip: string;
    port: number;
    account: string;
    password: string;
}

let config: Config = {
    ip: '172.16.10.100',
    port: 7000,
    account: 'Admin',
    password: '123456',
};
export default config;
