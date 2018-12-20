import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, IConfig, Config, IConfigSetup,
    Action, Errors, Floors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';
import * as request from 'request';
import { actions } from 'helpers/routers/router-loader';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
interface PathObject {
    [index: string]: {
        input: string;
        output: string;
        loginRequired: boolean;
    }
}
interface Output {
    [path: string]: PathObject;
}


action.get( async (data) => {
    let final: Output = {};

    for (let action of actions) {
        let uri = action.uri;
        if (uri === '/apis') continue;
        !final[uri] && (final[uri] = {});
        let obj = final[uri];

        for (let proto of action.list()) {
            let loginRequired: boolean = false;
            switch (proto) {
                case 'All':
                case 'Get':
                case 'Post':
                case 'Put':
                case 'Delete':
                    /// get configs
                    /// login required?
                    loginRequired = (action[`func${proto}Config`] || {}).loginRequired || ((action.config || {}).loginRequired);

                    let method = (proto === 'All' ? 'Get' : proto).toUpperCase();

                    let result: string;
                    try {
                    result = await new Promise<string>( (resolve, reject) => {
                        request({
                            url: `http://localhost:${Config.core.port}${uri}?help&sessionId=${data.parameters.sessionId}`,
                            method,
                        }, (err, res, body) => {
                            if (res.statusCode === 401) return reject(401);
                            resolve(body);
                        });
                    });
                    } catch(e) {
                        continue;
                    }

                    /// extract input interface
                    const iRegex = /Input Interface:(?:\r?\n|\r)=+(?:\r?\n|\r)*/;
                    let imatch = iRegex.exec(result);
                    /// extract output interface
                    const oRegex = /(?:\r?\n|\r)*Output Interface:(?:\r?\n|\r)=+(?:\r?\n|\r)*/;
                    let omatch = oRegex.exec(result);

                    /// matches
                    let input = null;
                    if (imatch !== null) {
                        let istart = imatch.index + imatch[0].length;
                        let iend = omatch ? omatch.index : result.length;
                        input = result.substring(istart, iend);
                    }

                    let output = null;
                    if (omatch !== null) {
                        let ostart = omatch.index + omatch[0].length;
                        let oend = result.length;
                        output = result.substring(ostart, oend).replace(/(?:\r?\n|\r)*$/, '');
                    }

                    obj[proto] = { input, output, loginRequired };

                    break;
                case 'Ws':
                    /// get configs
                    /// login required?
                    loginRequired = (action[`func${proto}Config`] || {}).loginRequired || ((action.config || {}).loginRequired);
                    obj[proto] = { input: null, output: null, loginRequired };
                default:
                    break;
            }
        }
    }

    return final;

    // return actions.reduce( (final, action) => {
    //     //return action.list()
    //     let uri = action.uri;
    //     !final[uri] && (final[uri] = {});
    //     let obj = final[uri];

    //     for () action.list()

    //     //return action.uri
    // }, {});


    // /// 1) Make Query
    // var query = new Parse.Query(Floors);
    // /// 2) With Extra Filters
    // query = Restful.Filter(query, data.inputType);
    // /// 3) Output
    // return Restful.Pagination(query, data.parameters);
});
/// CRUD end ///////////////////////////////////

export default action;
