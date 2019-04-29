import { Config } from 'config_default/smtp';
export { Config };

var config: Partial<Config> = {
    enable: false,
    host: '',
    port: 0,
    email: '',
    password: '',
};
export default config;
