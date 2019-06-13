
import { Config } from 'config_default/mongodb';

var config: Partial<Config> = {
    collection: "FET_ACS",
    ip: "localhost",
    port: 27017,
    enable:true
};
export default config;
export { Config };