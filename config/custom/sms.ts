var config: Config = {
    enable: false,
    comPort: 1
}
export default config;

export interface Config {
    enable: boolean;
    comPort: number;
}