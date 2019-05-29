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

            let childrens: IResponse.ILocation.ITree[] = (await GetRegionChildrens()).sort((a, b) => {
                return a.lft - b.lft;
            });

            let tree: IResponse.ILocation.ITree = childrens.splice(0, 1)[0];

            for (let i = childrens.length - 1; i > -1; i--) {
                childrens[i].childrens.push(
                    ...childrens.filter((value, index, array) => {
                        return childrens[i].lft < value.lft && childrens[i].rgt > value.rgt;
                    }),
                );

                let keys: string[] = childrens[i].childrens.map((value, index, array) => {
                    return value.objectId;
                });

                childrens = childrens.filter((value, index, array) => {
                    return keys.indexOf(value.objectId) < 0;
                });
            }

            tree.childrens = childrens;

            return tree;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Get region childrens
 */
async function GetRegionChildrens(): Promise<IResponse.ILocation.ITree[]> {
    try {
        let root: IDB.LocationRegion = await CreateRoot();

        let regions: IDB.LocationRegion[] = await new Parse.Query(IDB.LocationRegion).find().fail((e) => {
            throw e;
        });

        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
            .notEqualTo('region', null)
            .find()
            .fail((e) => {
                throw e;
            });

        let allTags: IDB.Tag[] = await new Parse.Query(IDB.Tag).find().fail((e) => {
            throw e;
        });

        let childrens: IResponse.ILocation.ITree[] = regions.map((value, index, array) => {
            let parents: IDB.LocationRegion[] = array.filter((value1, index1, array1) => {
                return value1.getValue('lft') < value.getValue('lft') && value1.getValue('rgt') > value.getValue('rgt');
            });

            let tags: IResponse.IObject[] = allTags
                .filter((value1, index1, array1) => {
                    let regionIds: string[] = value1.getValue('regions').map((value2, index2, array2) => {
                        return value2.id;
                    });
                    return regionIds.indexOf(value.id) > -1;
                })
                .map((value1, index1, array1) => {
                    return {
                        objectId: value1.id,
                        name: value1.getValue('name'),
                    };
                });

            let regionData: IResponse.ILocation.ITreeRegion = {
                name: value.getValue('name'),
                customId: value.getValue('customId'),
                address: value.getValue('address'),
                tags: tags,
                imageSrc: value.getValue('imageSrc'),
                longitude: value.getValue('longitude'),
                latitude: value.getValue('latitude'),
            };

            let siteChildrens: IResponse.ILocation.ITree[] = GetSiteChildrens(value, sites, allTags);

            return {
                objectId: value.id,
                parentId: parents.length > 0 ? parents[parents.length - 1].id : '',
                type: value.getValue('type'),
                data: regionData,
                lft: value.getValue('lft'),
                rgt: value.getValue('rgt'),
                childrens: siteChildrens,
            };
        });

        return childrens;
    } catch (e) {
        throw e;
    }
}

/**
 * Get site childrens
 * @param region
 * @param sites
 * @param managerInfos
 * @param tags
 */
function GetSiteChildrens(region: IDB.LocationRegion, sites: IDB.LocationSite[], allTags: IDB.Tag[]): IResponse.ILocation.ITree[] {
    try {
        let childrens: IResponse.ILocation.ITree[] = sites
            .filter((value, index, array) => {
                return value.getValue('region').id === region.id;
            })
            .map((value, index, array) => {
                let tags: IResponse.IObject[] = allTags
                    .filter((value1, index1, array1) => {
                        let regionIds: string[] = value1.getValue('sites').map((value2, index2, array2) => {
                            return value2.id;
                        });
                        return regionIds.indexOf(value.id) > -1;
                    })
                    .map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                let siteData: IResponse.ILocation.ITreeSite = {
                    name: value.getValue('name'),
                    customId: value.getValue('customId'),
                    address: value.getValue('address'),
                    tags: tags,
                    imageSrc: value.getValue('imageSrc'),
                    longitude: value.getValue('longitude'),
                    latitude: value.getValue('latitude'),
                };

                return {
                    objectId: value.id,
                    parentId: region.id,
                    type: 'site',
                    data: siteData,
                    lft: region.getValue('lft'),
                    rgt: region.getValue('rgt'),
                    childrens: [],
                };
            });

        return childrens;
    } catch (e) {
        throw e;
    }
}
