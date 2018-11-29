var config: Config = {
    compareFaceThreshold: 0.7,

    visitorExpireEnabled: true,
    visitorExpireDay: 180
}
export default config;

export interface Config {
    compareFaceThreshold: number;

    visitorExpireEnabled: boolean;
    visitorExpireDay: number;
}