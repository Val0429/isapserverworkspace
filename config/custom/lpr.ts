export interface Config {
    productId: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    broadcastIp: string;
    broadcastPort: number;
}

let config: Config = {
    productId: "",
    protocol: "http",
    ip: "127.0.0.1",
    port: 80,
    broadcastIp: "224.255.255.255",
    broadcastPort: 8002
};
export default config;
