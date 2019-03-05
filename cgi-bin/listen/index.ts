import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, CharacterCommittee, CharacterResident, Listen } from '../../custom/models';
import { File } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId);
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let listen: Listen = new Listen();

        listen.setValue('creator', data.user);
        listen.setValue('resident', resident);
        listen.setValue('title', _input.title);
        listen.setValue('content', _input.content);
        listen.setValue('replys', []);
        listen.setValue('status', Enum.ReceiveStatus.unreceived);
        listen.setValue('attachmentSrc', '');

        await listen.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        if (_input.attachment && _input.extension) {
            let attachmentSrc: string = `files/${listen.id}_listen_${listen.createdAt.getTime()}.${_input.extension}`;
            File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);

            listen.setValue('attachmentSrc', attachmentSrc);

            await listen.save(null, { useMasterKey: true }).catch((e) => {
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<Listen> = new Parse.Query(Listen);
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

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let listens: Listen[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .include('replier')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = [].concat(
            ...listens.map((value, index, array) => {
                return value.getValue('replys').map((value1, index1, array1) => {
                    return new Parse.Query(CharacterCommittee).equalTo('user', value1.replier).first();
                });
            }),
        );
        let committees: CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
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
                        return {
                            id: value1.replier.id,
                            name: committees
                                .find((value2, index2, array2) => {
                                    return value2.getValue('user').id === value1.replier.id;
                                })
                                .getValue('name'),
                            content: value1.content,
                            date: value1.date,
                        };
                    }),
                };
            }),
        };
    },
);

// /**
//  * Action update
//  */
// type InputU = IRequest.IListen.IIndexU;

// type OutputU = Date;

// action.put(
//     {
//         inputType: 'InputU',
//         postSizeLimit: 10000000,
//         permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee],
//     },
//     async (data): Promise<OutputU> => {
//         let _input: InputU = data.inputType;

//         let listen: Listen = await new Parse.Query(Listen).get(_input.listenId).catch((e) => {
//             throw e;
//         });
//         if (!listen) {
//             throw Errors.throw(Errors.CustomBadRequest, ['listen not found']);
//         }

//         listen.setValue('title', _input.title);
//         listen.setValue('content', _input.content);
//         listen.setValue('replyContent', _input.replyContent);

//         if (listen.getValue('status') === Enum.ReceiveStatus.received) {
//             listen.setValue('replier', data.user);
//             listen.setValue('replyDate', new Date());
//         }

//         await listen.save(null, { useMasterKey: true }).catch((e) => {
//             throw e;
//         });

//         if (_input.attachment && _input.extension) {
//             let attachmentSrc: string = `files/${listen.id}_listen_${listen.createdAt.getTime()}.${_input.extension}`;
//             File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);
//         }

//         return new Date();
//     },
// );

/**
 * Action Delete
 */
type InputD = IRequest.IListen.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _listenIds: string[] = [].concat(data.parameters.listenIds);

        _listenIds = _listenIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _listenIds.map((value, index, array) => {
            return new Parse.Query(Listen).get(value);
        });
        let listens: Listen[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = listens.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        listens.forEach((value, index, array) => {
            if (value.getValue('attachmentSrc') && value.getValue('attachmentSrc') !== '') {
                File.DeleteFile(`${File.assetsPath}/${value.getValue('attachmentSrc')}`);
            }
        });

        return new Date();
    },
);
