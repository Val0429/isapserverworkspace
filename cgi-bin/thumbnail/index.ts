import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, ParseObject,
    Action, Errors,
} from 'core/cgi-package';
import * as request from 'request';
const sharp = require('sharp');

export interface Input {
    url: string;
    size: number;
}

var action = new Action<Input>({
    loginRequired: true
});

action.get({inputType: "Input"}, async (data) => {
    let resp = data.response;
    let { size, url } = data.inputType;

    request({
        url,
        method: 'GET',
        encoding: null
    }, async (err, res, body) => {
        if (err) {
            resp.sendStatus(404);
            return;
        }

        body = await sharp(body)
            .resize(size)
            .toBuffer();

        resp.setHeader("content-type", res.headers["content-type"]);
        resp.end(body, "binary");
    });
});

export default action;
