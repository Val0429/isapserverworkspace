import * as express from 'express';
import { app } from './../core/main.gen';
import { deployWeb } from 'helpers/deploy-web';
import { Config } from 'core/config.gen';

app.use(`/export`, express.static(`workspace/custom/assets/export`));

/// overwrite flow
import * as fs from 'fs';
let writeJsPath = `${__dirname}/custom/web/public/window.js`;
let exists = fs.existsSync(writeJsPath);
if (exists) {
    let data = fs.readFileSync(writeJsPath, "UTF-8");
    let flow = Config.vms.flow;
    let regexp = new RegExp("\"" + flow + "\"", "m");
    let correct = regexp.test(data);
    if (!correct) {
        data = data.replace(/\"([^"]+)\"/, (a,b,c) => {
            return `"${flow}"`;
        });
        fs.writeFileSync(writeJsPath, data, "UTF-8");
    }
}

deployWeb(`${__dirname}/../workspace/custom/web-crms`, Config.vms.crmsWebPort);

import './custom/shells/index';
import 'services/pin-code';

import 'workspace/custom/services/crms-service';

// import * as CryptoJS from 'crypto-js';

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

