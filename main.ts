import * as express from 'express';
import * as history from 'connect-history-api-fallback';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility, DateTime } from './custom/helpers';

import './custom/shells/create-index';
import './custom/shells/create-default';
import './custom/shells/auto-index';

app.use(history());
app.use(`/images`, express.static(`workspace/custom/assets/images`));
app.use(`/human_detection`, express.static(`workspace/custom/assets/human_detection`));
app.use(`/logs`, express.static(`workspace/custom/assets/logs`));

import './custom/actions';
import './custom/services';

import * as Action from './custom/actions';

setTimeout(() => {
    Action.WriteLog.action$.next('');
    Action.WriteLog.action$.next(`${DateTime.ToString(new Date())} Success ---> Server start`);

    let node_env: string = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development' ? 'Production' : 'Development';
    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: `- ${node_env} Mode` });

    let ips: Utility.IIp[] = Utility.GetIp();
    if (ips.length > 0) {
        if (!Config.core.httpDisabled) Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '-' }, { message: `http://${ips[0].ip}:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '-' }, { message: `https://${ips[0].ip}:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    } else {
        if (!Config.core.httpDisabled) Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '-' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '-' }, { message: `https://localhost:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    }
}, 100);
