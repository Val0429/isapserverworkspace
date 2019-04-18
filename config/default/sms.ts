import { Config } from 'config_default/sms';
export { Config };

var config: Partial<Config> = {
    enable: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
};
export default config;
