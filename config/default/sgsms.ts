import { Config } from 'config_default/sgsms';
export { Config };

var config: Partial<Config> = {
    enable: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
    url: 'https://mx.fortdigital.net/http/send-message',
    username: 'test60',
    password: 'test60',
};
export default config;
