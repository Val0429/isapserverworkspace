var config: Config = {
    flow: "Flow1",
    compareFaceThreshold: 0.7,

    visitorExpireEnabled: true,
    visitorExpireDay: 180
}
export default config;

type Flow = "Flow1";

export interface Config {
    flow: Flow;
    compareFaceThreshold: number;

    visitorExpireEnabled: boolean;
    visitorExpireDay: number;
}