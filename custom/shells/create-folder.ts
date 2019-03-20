import { Config } from 'core/config.gen';
import { File } from '../helpers';

(async () => {
    if (Config.demographic) {
        File.CreateFolder(`${File.assetsPath}/${Config.demographic.output.path}`);
    }

    if (Config.humanDetection) {
        File.CreateFolder(`${File.assetsPath}/${Config.humanDetection.output.path}`);
    }
})();
