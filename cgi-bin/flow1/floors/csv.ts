import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful,
} from 'core/cgi-package';

import { FileHelper } from 'helpers/parse-server/file-helper';

import { Flow1Floors, IFlow1Floors } from 'workspace/custom/models';

//import * as csv from 'fast-csv';
import * as parseCsv from 'node-csv-parse';

var action = new Action({
    loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

interface ICsvC {
    data: string;
}

type InputC = Restful.InputC<ICsvC>;

action.post<InputC>({ inputType: "InputC" }, async (data) => {
    var content = FileHelper.toBufferFromBase64(data.parameters.data).toString();
    var result = parseCsv(content);

    var floors: Flow1Floors[] = result.asObjects()
        .reduce( (final, value) => {
            do {
                if (!value.floor || !value.name) break;
                final.push(new Flow1Floors({
                    floor: +value.floor,
                    name: value.name,
                    // phone: (value.phone || "").split(",")
                }));
            } while(0);
            return final;
        }, []);

    await Parse.Object.saveAll(floors);
    
    return {
        paging: {
            count: floors.length
        }
    }
});

export default action;