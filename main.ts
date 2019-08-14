import * as express from 'express';
import { app } from './../core/main.gen';
import { deployWeb } from 'helpers/deploy-web';
import { Config } from 'core/config.gen';

app.use(`/export`, express.static(`workspace/custom/assets/export`));

deployWeb(`${__dirname}/../workspace/custom/web-crms`, Config.vms.crmsWebPort);

import './custom/shells/index';
import 'services/pin-code';

import 'workspace/custom/services/crms-service';

// import './custom/services/frs-service';
// import './custom/schedulers/index';

// import './custom/services/visitor-code';
// import { serverReady } from 'core/pending-tasks';

// import { IssueCardDaily } from './cgi-bin/visitors/flow-strict/__api__/issueCard';
// (async () => {
//     await serverReady;
//     // 3) At Everyday 00:00 or when Server Restart
//     // 	3.1) Check (A) for outdated data, and then remove (B) (A)
//     IssueCardDaily();
// })();
