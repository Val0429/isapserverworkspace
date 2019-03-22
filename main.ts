import * as express from 'express';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility, File } from './custom/helpers';

import './custom/shells/create-index';
import './custom/shells/create-default';
import './custom/shells/auto-index';

import './custom/services/notice';

app.use(`/images`, express.static(`workspace/custom/assets/images`));
app.use(`/files`, express.static(`workspace/custom/assets/files`));

setTimeout(() => {
    let node_env: string = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development' ? 'Production' : 'Development';
    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: `- ${node_env} Mode` });

    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Local:  ' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });

    let ips: Utility.IIp[] = Utility.GetIp();
    if (ips.length > 0) {
        Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Network:' }, { message: `http://${ips[0].ip}:${Config.core.port}`, color: Print.FontColor.cyan });
    }
}, 10);
