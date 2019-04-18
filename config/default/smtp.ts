import { Config } from 'config_default/smtp';
export { Config };

var config: Partial<Config> = {
    enable: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
    host: 'mail.isapsolution.com',
    port: 25,
    email: 'services@isapsolution.com',
    password: 'Az123456',
};
export default config;
