import { File } from '../helpers';

(async () => {
    File.CreateFolder(`${File.assetsPath}/logs`);
    File.CreateFolder(`${File.assetsPath}/images`);
    File.CreateFolder(`${File.assetsPath}/files`);
})();
