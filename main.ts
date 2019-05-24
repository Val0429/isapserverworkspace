import { app } from './../core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/index';
import 'services/pin-code';

import './custom/services/visitor-code';


import { serverReady } from 'core/pending-tasks';

import { IssueCardDaily } from './cgi-bin/visitors/flow-strict/__api__/issueCard';
(async () => {
    await serverReady;
    // 3) At Everyday 00:00 or when Server Restart
    // 	3.1) Check (A) for outdated data, and then remove (B) (A)
    IssueCardDaily();
})();

