import { IUser, Action, Restful, RoleList, Errors, IConfig, Config } from 'core/cgi-package';
import { wsDefPath, wsCustomPath } from 'shells/config.shell';
import * as Path from 'path';
import * as Fs from 'fs';
import { promisify } from 'bluebird';
import { IRequest, IResponse } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IConfig.IIndexR;

type OutputR = IResponse.IConfig.IIndexR[] | IResponse.IConfig.IIndexR;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let configs: OutputR;
            if (_input.key === '*') {
                configs = Object.keys(Config).map((value, index, array) => {
                    return {
                        [value]: Config[value],
                    };
                });
            } else {
                configs = {
                    [_input.key]: Config[_input.key],
                };
            }

            return configs;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Update
 */
type InputU = IRequest.IConfig.IIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            for (let key in _input.data) {
                /// update data
                await UpdateConfig(key, _input.data[key]);
                /// update memory
                Config[key] = { ...Config[key], ..._input.data[key] };
            }

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Update Config
 * @param key
 * @param data
 */
export async function UpdateConfig(key: string, data: object) {
    /// 1) find real path of workspace config
    let result;
    let regex = /[A-Z]/g;
    let dashedKey = key.replace(regex, (a, b) => `-${a.toLowerCase()}`);

    for (let dir of [wsDefPath, wsCustomPath]) {
        let files: string[] = <any>await promisify(Fs.readdir)(dir);
        for (let file of files) {
            let name = Path.parse(file).name;
            if (name === dashedKey) {
                result = `${dir}/${dashedKey}.ts`;
                break;
            }
        }
        if (result) {
            break;
        }
    }
    if (!result) {
        throw Errors.throw(Errors.CustomNotExists, [`config path not found <${key}>`]);
    }

    /// 2) read file
    let content: string = await (promisify(Fs.readFile) as any)(result, 'UTF-8');

    /// 2) match export default {0}
    regex = /export default ([^\s;]+)/;
    let matches = content.match(regex);
    if (matches.length < 2) {
        throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);
    }
    let token = matches[1];

    /// 3) match {0} with var {0}: any = { }.
    regex = new RegExp(` ${token}[\: \=]`);
    let found = content.search(regex);
    if (found < 0) {
        throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);
    }

    /// 4) get content of 3) inside braclets as {1}
    let start,
        end,
        ct = 1;
    for (let i = found + 1; i < content.length; ++i) {
        let tok = content[i];
        if (!start) {
            if (tok === '{') start = i;
            continue;
        }
        switch (tok) {
            case '{':
                ct++;
                break;
            case '}':
                ct--;
                break;
            default:
                break;
        }
        if (ct === 0) {
            end = i + 1;
            break;
        }
    }
    if (!start || !end) {
        throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);
    }

    let innerContent = content.substring(start, end);
    let parser = (input: string): object => {
        /// remove trailing comma
        return eval(`(${input})`);
    };
    let innerObject = parser(innerContent);

    /// 5) replace {1} with data
    innerObject = { ...innerObject, ...data };
    let prettifier = (input: string): string => {
        let regex = /"([^"]+)":/gm;
        return input.replace(regex, (a, b) => b + ':');
    };
    let final = `${content.substring(0, start)}${prettifier(JSON.stringify(innerObject, undefined, 4))}${content.substring(end)}`;

    /// 6) write back
    await (<any>promisify(Fs.writeFile))(result, final);
}
