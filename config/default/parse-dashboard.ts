import { Config } from 'config_default/parse-dashboard';

var config: Partial<Config> = {
    enable: false,
    serverPath: '/dashboard',
    appName: 'Bar App',
};
export default config;
export { Config };
