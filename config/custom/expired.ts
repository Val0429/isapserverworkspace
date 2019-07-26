export interface Config {
    reportDay: number;
    userEnableVerificationHour: number;
    userForgetVerificationHour: number;
}

var config: Partial<Config> = {
    reportDay: 90,
    userEnableVerificationHour: 7,
    userForgetVerificationHour: 1,
};
export default config;
