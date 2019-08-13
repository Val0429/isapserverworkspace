import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = {
    days: number;
};

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let days = Config.vms.workerExpiredDay;

            return {
                days: days,
            };
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = {
    days: number;
};

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            await updateConfig('vms', {
                workerExpiredDay: _input.days,
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);

/**
 *
 */
import { wsDefPath, wsCustomPath } from 'shells/config.shell';
import * as p from 'path';
import * as fs from 'fs';
import { promisify } from 'bluebird';

async function updateConfig(key: string, data: object) {
    /// 1) find real path of workspace config
    var result;
    var regex = /[A-Z]/g;
    var dashedKey = key.replace(regex, (a, b) => `-${a.toLowerCase()}`);

    for (var dir of [wsDefPath, wsCustomPath]) {
        var files: string[] = <any>await promisify(fs.readdir)(dir);
        for (var file of files) {
            var name = p.parse(file).name;
            if (name === dashedKey) {
                result = `${dir}/${dashedKey}.ts`;
                break;
            }
        }
        if (result) break;
    }
    if (!result) throw Errors.throw(Errors.CustomNotExists, [`config path not found <${key}>`]);

    /// 2) read file
    var content: string = await (promisify(fs.readFile) as any)(result, 'UTF-8');

    /// 2) match export default {0}
    var regex = /export default ([^\s;]+)/;
    var matches = content.match(regex);
    if (matches.length < 2) throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);
    var token = matches[1];

    /// 3) match {0} with var {0}: any = { }.
    var regex = new RegExp(` ${token}[\: \=]`);
    var found = content.search(regex);
    if (found < 0) throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);

    /// 4) get content of 3) inside braclets as {1}
    var start,
        end,
        ct = 1;
    for (var i = found + 1; i < content.length; ++i) {
        var tok = content[i];
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
    if (!start || !end) throw Errors.throw(Errors.CustomInvalid, [`config path format error <${key}>`]);
    var innerContent = content.substring(start, end);
    var parser = (input: string): object => {
        /// remove trailing comma
        return eval(`(${input})`);
    };
    var innerObject = parser(innerContent);

    /// 5) replace {1} with data
    innerObject = { ...innerObject, ...data };
    var prettifier = (input: string): string => {
        var regex = /"([^"]+)":/gm;
        return input.replace(regex, (a, b) => b + ':');
    };
    var final = `${content.substring(0, start)}${prettifier(JSON.stringify(innerObject, undefined, 4))}${content.substring(end)}`;

    /// 6) write back
    await (<any>promisify(fs.writeFile))(result, final);
}