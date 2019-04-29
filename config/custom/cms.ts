export interface Config {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

let config: Config = {
    protocol: 'http',
    ip: '127.0.0.1',
    port: 8080,
    account: '',
    password: '',
};
export default config;
