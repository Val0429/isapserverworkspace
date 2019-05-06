import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6065,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: '',
    httpDisabled: false,
    httpsEnabled: true,
    httpsPort: 4448,
};
export default config;
export { Config };
