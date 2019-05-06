import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File, Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import { GetExtension } from '../listen';
import Notice from '../../custom/actions/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicNotify.IIndexC;

type OutputC = IResponse.IPublicNotify.IIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let extension: string = '';
            if (_input.attachment) {
                extension = GetExtension(_input.attachment);
            }

            let publicNotify: IDB.PublicNotify = new IDB.PublicNotify();

            publicNotify.setValue('creator', data.user);
            publicNotify.setValue('community', _userInfo.community);
            publicNotify.setValue('date', _input.date);
            publicNotify.setValue('title', _input.title);
            publicNotify.setValue('content', _input.content);
            publicNotify.setValue('attachmentSrc', '');
            publicNotify.setValue('aims', _input.aims);
            publicNotify.setValue('isDeleted', false);
            publicNotify.setValue('isTop', _input.isTop);

            await publicNotify.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            if (_input.attachment) {
                let attachmentSrc: string = `files/${publicNotify.id}_notify_${publicNotify.createdAt.getTime()}.${extension}`;
                File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);

                publicNotify.setValue('attachmentSrc', attachmentSrc);

                await publicNotify.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value,
                    type: Enum.MessageType.publicNotifyNew,
                    data: publicNotify,
                    aims: _input.aims,
                    message: {
                        title: publicNotify.getValue('title'),
                    },
                });
            });

            return {
                publicNotifyId: publicNotify.id,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPublicNotify.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IPublicNotify.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.PublicNotify> = new Parse.Query(IDB.PublicNotify).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
            if (_input.start) {
                query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
            }
            if (_input.end) {
                query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
            }

            if (_userInfo.residentInfo) {
                query.containedIn('aims', [_userInfo.residentInfo.getValue('character')]);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let publicNotifys: IDB.PublicNotify[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .descending(['isTop', 'date'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let tasks: Promise<any>[] = publicNotifys.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value.getValue('creator')).first();
            });
            let committees: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return {
                total: total,
                page: _page,
                count: _count,
                content: publicNotifys.map((value, index, array) => {
                    return {
                        publicNotifyId: value.id,
                        date: value.getValue('date'),
                        title: value.getValue('title'),
                        content: value.getValue('content'),
                        attachmentSrc: value.getValue('attachmentSrc'),
                        creatorName: committees[index] ? committees[index].getValue('name') : '',
                        aims: value.getValue('aims'),
                        isTop: value.getValue('isTop') || false,
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPublicNotify.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let extension: string = '';
            if (_input.attachment) {
                extension = GetExtension(_input.attachment);
            }

            let publicNotify: IDB.PublicNotify = await new Parse.Query(IDB.PublicNotify).get(_input.publicNotifyId).fail((e) => {
                throw e;
            });
            if (!publicNotify) {
                throw Errors.throw(Errors.CustomBadRequest, ['public notify not found']);
            }
            if (publicNotify.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['public notify was deleted']);
            }

            publicNotify.setValue('date', _input.date);
            publicNotify.setValue('title', _input.title);
            publicNotify.setValue('content', _input.content);
            publicNotify.setValue('isTop', _input.isTop);

            await publicNotify.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            if (_input.attachment) {
                let attachmentSrc: string = `files/${publicNotify.id}_notify_${publicNotify.createdAt.getTime()}.${extension}`;
                File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);
            }

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value,
                    type: Enum.MessageType.publicNotifyUpdate,
                    data: publicNotify,
                    aims: publicNotify.getValue('aims'),
                    message: {},
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IPublicNotify.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _publicNotifyIds: string[] = [].concat(data.parameters.publicNotifyIds);

            _publicNotifyIds = _publicNotifyIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _publicNotifyIds.map<any>((value, index, array) => {
                return new Parse.Query(IDB.PublicNotify).get(value);
            });
            let publicNotifys: IDB.PublicNotify[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = publicNotifys.map<any>((value, index, array) => {
                value.setValue('isDeleted', true);

                return value.save(null, { useMasterKey: true });
            });
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                publicNotifys.forEach((value1, index1, array1) => {
                    Notice.notice$.next({
                        resident: value,
                        type: Enum.MessageType.publicNotifyDelete,
                        aims: value1.getValue('aims'),
                        message: {
                            title: value1.getValue('title'),
                        },
                        data: value1,
                    });
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
