
import { Config } from 'config_default/sgsms';
export { Config };

var config: Partial<Config> = {
    enable: false,
    url: "https://mx.fortdigital.net/http/send-message",
    username: "test1",
    password: "test1"
};
export default config;
