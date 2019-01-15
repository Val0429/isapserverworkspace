import * as express from 'express';
import { app } from './../core/main.gen';

import './custom/schedulers/index';
import './custom/shells/index';
import 'services/pin-code/pin-code';
import './custom/services/hd';
// import './custom/services/weigand';

app.use('/snapshots', express.static('workspace/custom/assets/snapshots'));
