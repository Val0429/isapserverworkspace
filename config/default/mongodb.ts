
import { Config } from 'config_default/mongodb';

var config: Partial<Config> = {
    collection: "LargeData",
    ip: "172.16.10.122",
    port: 27017
};
export default config;
export { Config };