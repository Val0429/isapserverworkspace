
import { Config } from 'config_default/smtp';
export { Config };

var config: Partial<Config> = {
    enable: true,
    host: "mail.isapsolution.com",
    port: 25,
    email: "services@isapsolution.com",
    password: "Az123456"
};
export default config;
