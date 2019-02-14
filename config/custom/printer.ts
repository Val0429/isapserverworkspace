export interface Config {
    ip: string;
    dllPath: string;
}

let config: Config = {
    ip: "172.16.10.13",
    dllPath: "./workspace/custom/assets/libs/tsclibnet.dll"
};
export default config;
