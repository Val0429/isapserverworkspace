import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { Tree, IGetTreeNodeR, IGetTreeNodeL } from 'models/nodes';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import { CreateRoot } from './region';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ILocation.ITree;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let root: IDB.LocationRegion = await CreateRoot();

            let locations: IDB.LocationRegion[] = await new Parse.Query(IDB.LocationRegion).find().fail((e) => {
                throw e;
            });

            let datas: IResponse.ILocation.ITree[] = locations
                .map((value, index, array) => {
                    let parents: IDB.LocationRegion[] = array.filter((value1, index1, array1) => {
                        return value1.getValue('lft') < value.getValue('lft') && value1.getValue('rgt') > value.getValue('rgt');
                    });

                    let data: IResponse.ILocation.IRegionIndexR_Base = {
                        name: value.getValue('name'),
                        customId: value.getValue('customId'),
                        address: value.getValue('address'),
                        tags: (value.getValue('tags') || []).map((value1, index1, array1) => {
                            return {
                                objectId: value1.id,
                                name: value1.getValue('name'),
                            };
                        }),
                        imageSrc: value.getValue('imageSrc'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                    };

                    return {
                        objectId: value.id,
                        parentId: parents.length > 0 ? parents[parents.length - 1].id : '',
                        type: value.getValue('type'),
                        data: data,
                        lft: value.getValue('lft'),
                        rgt: value.getValue('rgt'),
                        childrens: [],
                    };
                })
                .sort((a, b) => {
                    return a.lft - b.lft;
                });

            let region: IResponse.ILocation.ITree = datas.splice(0, 1)[0];

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

            region.childrens = datas;

            return region;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
