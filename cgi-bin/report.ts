import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Config,
} from 'core/cgi-package';
import { FileHelper } from 'helpers/parse-server/file-helper';

import * as request from 'request';
import * as fs from 'fs';

import { Observable } from 'rxjs';
import frs from 'workspace/custom/services/frs-service';

export interface Input {
    time: number;
    cameraName: string;
    mp4: string;
    snapshot?: string;
}

var action = new Action<Input>({
    loginRequired: false,
    // requiredParameters: ["time", "cameraName", "mp4"],
    postSizeLimit: 1024*1024*500
});

action.post( async (data) => {
    var { time, cameraName, mp4, snapshot } = data.parameters;
    //console.log(time, cameraName, mp4.length, snapshot.length);

    //var mp4file = await FileHelper.toParseFile(mp4);
    var snapshotfile = await FileHelper.toParseFile(snapshot);
    //var mp4url = mp4file.url().replace("//localhost", `//${Config.evis.thisComputerInternalAccessIp}`);
    var snapshoturl = snapshotfile.url().replace("//localhost", `//${Config.evis.thisComputerInternalAccessIp}`);

    var filename = `${new Date().valueOf()}.mp4`;
    var mp4url = `http://${Config.evis.thisComputerInternalAccessIp}:${Config.core.port}/files/${filename}`;
    var mp4data = new Buffer(mp4, 'base64');
    fs.writeFile(`${__dirname}/../custom/files/${filename}`, mp4data, null);

    var url = `http://${Config.evis.ip}:${Config.evis.port}/pushevents`;
    
    console.log(url, time, cameraName, snapshoturl, mp4url);

    request({
        url,
        method: 'POST',
        json: true,
        body: { type: "eventfts", data: { time, cameraName }, imgUrl: snapshoturl, mp4: mp4url }
    }, (err, res, body) => {
        // console.log(err, body);
        // if (err || !body) {
        //     console.log(`Login FRS Server failed@${config.ip}:${config.port}. Retry in 1 second.`);
        //     setTimeout(() => { tryLogin() }, 1000);
        //     return;
        // }

        // console.log(`Login into FRS Server@${config.ip}:${config.port}.`);
    });


    return;
});

export default action;