import * as express from 'express';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility } from './custom/helpers';

import './custom/schedulers/index';
import './custom/shells/index';

// import './custom/services/demo';
// import './custom/services/frs';
// import './custom/services/hd';
// import './custom/services/weigand';

app.use(`/${Config.humanDetection.output.path}`, express.static(`workspace/custom/assets/${Config.humanDetection.output.path}`));
app.use(`/${Config.demographic.output.path}`, express.static(`workspace/custom/assets/${Config.demographic.output.path}`));

setTimeout(() => {
    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Local:  ' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });

    let ips: Utility.IIp[] = Utility.GetIp();
    if (ips.length > 0) {
        Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Network:' }, { message: `http://${ips[0].ip}:${Config.core.port}`, color: Print.FontColor.cyan });
    }
}, 10);
