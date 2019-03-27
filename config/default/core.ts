import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6061,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: '',
    httpDisabled: false,
    httpsEnabled: true,
    httpsPort: 4444,
};
export default config;
export { Config };
