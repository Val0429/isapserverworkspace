import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IListen.IIndexC;

type OutputC = IResponse.IListen.IIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
        permission: [RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let extension: string = '';
        if (_input.attachment) {
            extension = GetExtension(_input.attachment);
        }

        let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId);
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let listen: IDB.Listen = new IDB.Listen();

        listen.setValue('creator', data.user);
        listen.setValue('community', _userInfo.community);
        listen.setValue('resident', resident);
        listen.setValue('title', _input.title);
        listen.setValue('content', _input.content);
        listen.setValue('replys', []);
        listen.setValue('status', Enum.ReceiveStatus.unreceived);
        listen.setValue('attachmentSrc', '');
        listen.setValue('isDeleted', false);

        await listen.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        if (_input.attachment) {
            let attachmentSrc: string = `files/${listen.id}_listen_${listen.createdAt.getTime()}.${extension}`;
            File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);

            listen.setValue('attachmentSrc', attachmentSrc);

            await listen.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        }

        return {
            listenId: listen.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IListen.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IListen.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.Listen> = new Parse.Query(IDB.Listen).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }
        if (_input.status === 'received') {
            query.equalTo('status', Enum.ReceiveStatus.received);
        } else if (_input.status === 'unreceived') {
            query.equalTo('status', Enum.ReceiveStatus.unreceived);
        }

        if (_userInfo.resident) {
            query.equalTo('resident', _userInfo.resident);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let listens: IDB.Listen[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include(['resident', 'replier'])
            .find()
            .fail((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = [].concat(
            ...listens.map((value, index, array) => {
                return value.getValue('replys').map((value1, index1, array1) => {
                    return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value1.replier).first();
                });
            }),
        );
        let committees: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: listens.map((value, index, array) => {
                return {
                    listenId: value.id,
                    residentId: value.getValue('resident').id,
                    residentAddress: value.getValue('resident').getValue('address'),
                    date: value.createdAt,
                    title: value.getValue('title'),
                    content: value.getValue('content'),
                    status: value.getValue('status'),
                    attachmentSrc: value.getValue('attachmentSrc'),
                    replys: value.getValue('replys').map((value1, index1, array1) => {
                        let committee: IDB.CharacterCommittee = committees.find((value2, index2, array2) => {
                            return value2 && value2.getValue('user').id === value1.replier.id;
                        });
                        return {
                            id: value1.replier.id,
                            name: committee ? committee.getValue('name') : '',
                            content: value1.content,
                            date: value1.date,
                        };
                    }),
                };
            }),
        };
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IListen.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _listenIds: string[] = [].concat(data.parameters.listenIds);

        _listenIds = _listenIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _listenIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.Listen).get(value);
        });
        let listens: IDB.Listen[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = listens.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        listens.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value.getValue('resident'),
                type: Enum.MessageType.listenDelete,
                data: value,
                message: {
                    title: value.getValue('title'),
                },
            });
        });

        return new Date();
    },
);

/**
 * Get file extension
 * (image/jpeg、image/png、application/pdf、audio/mp4、video/mp4、video/x-ms-wmv)
 * @param data
 */
export function GetExtension(data: string): string {
    try {
        if (data.indexOf('image/jpeg') > -1) {
            return 'jpeg';
        } else if (data.indexOf('image/png') > -1) {
            return 'png';
        } else if (data.indexOf('application/pdf') > -1) {
            return 'pdf';
        } else if (data.indexOf('audio/mp4') > -1) {
            return 'mp4';
        } else if (data.indexOf('video/mp4') > -1) {
            return 'mp4';
        } else if (data.indexOf('video/x-ms-wmv') > -1) {
            return 'wmv';
        } else {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }
    } catch (e) {
        throw e;
    }
}
