import * as express from 'express';
import * as history from 'connect-history-api-fallback';
import * as readline from 'readline';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility, DateTime } from './custom/helpers';

import './custom/shells/create-index';
import './custom/shells/create-default';
import './custom/shells/auto-index';

app.use(history());
app.use(`/images`, express.static(`workspace/custom/assets/images`));
app.use(`/files`, express.static(`workspace/custom/assets/files`));
app.use(`/logs`, express.static(`workspace/custom/assets/logs`));

import * as Action from './custom/actions';
import './custom/services';

setTimeout(() => {
    let node_env: string = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development' ? 'Production' : 'Development';
    let description: string = process.env.npm_package_description;
    let version: string = process.env.npm_package_version;

    Action.WriteLog.action$.next(`\r\n${DateTime.ToString(new Date())} Success ---> Server start - ${description}_v${version} (${node_env} Mode)`);

    console.log('\r\n'.repeat(process.stdout.rows));

    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    console.log();

    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: `- ${description}_v${version} (${node_env} Mode)` });

    let ips: Utility.IIp[] = Utility.GetIp();
    if (ips.length > 0) {
        if (!Config.core.httpDisabled) Print.Message({ message: '                     -' }, { message: `http://${ips[0].ip}:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '                     -' }, { message: `https://${ips[0].ip}:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    } else {
        if (!Config.core.httpDisabled) Print.Message({ message: '                     -' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '                     -' }, { message: `https://localhost:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    }
}, 100);
