
import { Config } from './../../../config_default/mongodb';
import VMSConfig from './../custom/vms';



var config: Partial<Config> = {
    collection: `VMS${VMSConfig.flow}`
};
export default config;
export { Config };