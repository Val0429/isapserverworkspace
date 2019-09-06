export interface Config {
    userForgetVerificationHour: number;
}

var config: Partial<Config> = {
    userForgetVerificationHour: 1,
};
export default config;
