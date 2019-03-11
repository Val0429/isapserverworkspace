export interface Config {
    ip: string;
    app: string;
    device: string;
}

let config: Config = {
    ip: '172.16.10.13',
    app: './workspace/custom/assets/TscPrinter/TscPrinter.exe',
    device: 'TSC TTP-247',
};
export default config;
