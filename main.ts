import * as express from 'express';
import * as history from 'connect-history-api-fallback';
import * as readline from 'readline';
import * as Rx from 'rxjs';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility, DateTime, File } from './custom/helpers';

export let ready$: Rx.Subject<{}> = new Rx.Subject();

app.use(history());
app.use(`/images`, express.static(`workspace/custom/assets/images`));
app.use(`/human_detection`, express.static(`workspace/custom/assets/human_detection`));
app.use(`/logs`, express.static(`workspace/custom/assets/logs`));

import './custom/shells/create-index';
import './custom/shells/create-default';
import './custom/shells/auto-index';

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

    let files: string[] = File.ReadFolder('workspace/custom/assets/license');
    files.forEach((value, index, array) => {
        File.CopyFile(`workspace/custom/assets/license/${value}`, `workspace/custom/license/${value}`);
    });

    files = File.ReadFolder('workspace/custom/assets/config/default');
    files.forEach((value, index, array) => {
        let file1 = File.ReadFile(`workspace/custom/assets/config/default/${value}`);
        let file2 = File.ReadFile(`workspace/config/default/${value}`);

        if (file1.toString() !== file2.toString()) {
            File.CopyFile(`workspace/custom/assets/config/default/${value}`, `workspace/config/default/${value}`);
        }
    });

    files = File.ReadFolder('workspace/custom/assets/config/custom');
    files.forEach((value, index, array) => {
        let file1 = File.ReadFile(`workspace/custom/assets/config/custom/${value}`);
        let file2 = File.ReadFile(`workspace/config/custom/${value}`);

        if (file1.toString() !== file2.toString()) {
            File.CopyFile(`workspace/custom/assets/config/custom/${value}`, `workspace/config/custom/${value}`);
        }
    });

    ready$.next(true);
}, 100);
