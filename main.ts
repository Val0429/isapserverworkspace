import * as express from 'express';
import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';
import { Print, Utility, File } from './custom/helpers';

import './custom/shells/create-index';
import './custom/shells/auto-index';

import './custom/services/notice';

setTimeout(() => {
    let assets: string[] = ['images', 'files'];
    assets.forEach((value, index, array) => {
        let path: string = `${File.assetsPath}/${value}`;
        File.CreateFolder(path);

        app.use(`/${value}`, express.static(`workspace/custom/assets/${value}`));

        Print.Message({ message: '  ', background: Print.BackColor.blue }, { message: 'Create folder at:', color: Print.FontColor.blue }, { message: `- workspace/custom/assets/${value}` });
    });

    Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Local:  ' }, { message: `http://localhost:${Config.core.port}`, color: Print.FontColor.cyan });

    let ips: Utility.IIp[] = Utility.GetIp();
    if (ips.length > 0) {
        Print.Message({ message: '  ', background: Print.BackColor.green }, { message: 'App running at:', color: Print.FontColor.green }, { message: '- Network:' }, { message: `http://${ips[0].ip}:${Config.core.port}`, color: Print.FontColor.cyan });
    }
}, 10);
