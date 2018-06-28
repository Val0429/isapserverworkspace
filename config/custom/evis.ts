var config: Config = {
    ip: "172.16.10.253",
    port: 6060,
    thisComputerInternalAccessIp: "172.16.10.122"
}
export default config;

export interface Config {
    ip: string;
    port: number;
    thisComputerInternalAccessIp: string;
}