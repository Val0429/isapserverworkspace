import { app } from 'core/main.gen';

var bodyParser = require('body-parser');

// import './custom/schedulers/index';
import './custom/shells/create-index';

// import './custom/services/frs-service';
// import './custom/services/hr-service';
import './custom/services';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
// app.use('/snapshot', express.static(`${__dirname}/custom/files/snapshots`));