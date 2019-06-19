import * as express from 'express';
import * as history from 'connect-history-api-fallback';
import * as readline from 'readline';
import * as Rx from 'rxjs';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { UpdateConfig } from './cgi-bin/config';

export let ready$: Rx.Subject<{}> = new Rx.Subject();

app.use(history());
app.use(`/images`, express.static(`workspace/custom/assets/images`));
app.use(`/logs`, express.static(`workspace/custom/assets/logs`));

import { Print, Utility, DateTime, File } from './custom/helpers';

import './custom/shells/create-index';
import './custom/shells/create-default';
import './custom/shells/auto-index';

import * as Action from './custom/actions';
import './custom/services';

setTimeout(() => {
    let node_env: string = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development' ? 'Production' : 'Development';
    let description: string = process.env.npm_package_description;
    let version: string = process.env.npm_package_version;

    let datetime = new DateTime();

    Action.WriteLog.action$.next(`\r\n${datetime.ToString(new Date())} Success ---> Server start - ${description}_v${version} (${node_env} Mode)`);

    console.log('\r\n'.repeat(process.stdout.rows));

    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    console.log();

    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: `- ${description}_v${version} (${node_env} Mode)` });

    let ips: Utility.INetwork[] = Utility.GetNetwork();
    if (ips.length > 0) {
        if (!Config.core.httpDisabled) Print.Message({ message: '                     -' }, { message: `http://${ips[0].address}:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '                     -' }, { message: `https://${ips[0].address}:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    } else {
        if (!Config.core.httpDisabled) Print.Message({ message: '                     -' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });
        if (Config.core.httpsEnabled) Print.Message({ message: '                     -' }, { message: `https://localhost:${Config.core.httpsPort}`, color: Print.FontColor.cyan });
    }

    let files: string[] = File.ReadFolder('workspace/custom/assets/license');
    files.forEach((value, index, array) => {
        File.CopyFile(`workspace/custom/assets/license/${value}`, `workspace/custom/license/${value}`);
    });

    files = File.ReadFolder('workspace/custom/assets/config');
    files.forEach(async (value, index, array) => {
        let type = value.substring(0, value.indexOf('.'));

        let config1 = JSON.parse(File.ReadFile(`workspace/custom/assets/config/${value}`).toString());
        let config2 = Config[type];

        for (var key in config1) {
            if (config2[key] && config2[key] !== config1[key]) {
                await UpdateConfig(type, config1);
            }
        }
    });

    ready$.next(true);
}, 100);
