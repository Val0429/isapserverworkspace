export interface Config {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    broadcastIp: string;
    broadcastPort: number;
}

let config: Config = {
    protocol: 'http',
    ip: '127.0.0.1',
    port: 80,
    broadcastIp: '127.0.0.1',
    broadcastPort: 80,
};
export default config;
