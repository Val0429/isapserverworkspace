import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6064,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: '',
    httpDisabled: false,
    httpsEnabled: true,
    httpsPort: 4447,
};
export default config;
export { Config };
