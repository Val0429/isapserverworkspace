import { app } from 'core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

// app.use('/snapshot', express.static(`${__dirname}/custom/files/snapshots`));