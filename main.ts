import { app } from './../core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/index';
import 'services/pin-code/pin-code';


import frs from './custom/services/frs-service';
(async () => {
    let result = await frs.getGroupList();
    console.log('???', result);
})();
