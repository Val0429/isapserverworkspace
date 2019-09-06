import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6067,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: '',
    httpDisabled: false,
    httpsEnabled: true,
    httpsPort: 4450,
};
export default config;
export { Config };
