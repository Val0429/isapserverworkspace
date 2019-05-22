import { IUser, Action, Restful, RoleList, Errors, Socket, ParseObject, Level } from 'core/cgi-package';
import { Tree, IGetTreeNodeR, IGetTreeNodeL } from 'models/nodes';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ILocation.IMapTree;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let root: IDB.LocationMap = await IDB.LocationMap.getRoot();
            if (!root) {
                root = await IDB.LocationMap.setRoot(undefined);
            }

            let locations: IDB.LocationMap[] = await new Parse.Query(IDB.LocationMap).find().fail((e) => {
                throw e;
            });

            let datas: IResponse.ILocation.IMapTree[] = locations
                .map((value, index, array) => {
                    return {
                        objectId: value.id,
                        level: value.getValue('level') ? Enum.ELocationLevel[value.getValue('level')] : 'root',
                        name: value.getValue('name') || 'root',
                        lft: value.getValue('lft'),
                        rgt: value.getValue('rgt'),
                        childrens: [],
                    };
                })
                .sort((a, b) => {
                    return a.lft - b.lft;
                });

            let tree: IResponse.ILocation.IMapTree = datas.splice(0, 1)[0];

            for (let i = datas.length - 1; i > -1; i--) {
                datas[i].childrens = datas.filter((value, index, array) => {
                    return datas[i].lft < value.lft && datas[i].rgt > value.rgt;
                });

                let keys: string[] = datas[i].childrens.map((value, index, array) => {
                    return value.objectId;
                });

                datas = datas.filter((value, index, array) => {
                    return keys.indexOf(value.objectId) < 0;
                });
            }

            tree.childrens = datas;

            return tree;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
