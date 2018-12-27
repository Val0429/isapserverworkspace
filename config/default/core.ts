
import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6060,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: "",
    httpsEnabled: true
};
export default config;
export { Config };