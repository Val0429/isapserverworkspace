import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicNotify, CharacterCommittee } from '../../custom/models';
import { File } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let publicNotify: PublicNotify = new PublicNotify();

        publicNotify.setValue('creator', data.user);
        publicNotify.setValue('date', _input.date);
        publicNotify.setValue('title', _input.title);
        publicNotify.setValue('content', _input.content);
        publicNotify.setValue('attachmentSrc', '');

        await publicNotify.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let attachmentSrc: string = `files/${publicNotify.id}_notify_${publicNotify.createdAt.getTime()}.${_input.extension}`;
        File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);

        publicNotify.setValue('attachmentSrc', attachmentSrc);

        await publicNotify.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            publicNotifyId: publicNotify.id,
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<PublicNotify> = new Parse.Query(PublicNotify);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', _input.start);
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let publicNotifys: PublicNotify[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = publicNotifys.map((value, index, array) => {
            return new Parse.Query(CharacterCommittee)
                .equalTo('user', value.getValue('creator'))
                .first()
                .catch((e) => {
                    throw e;
                });
        });
        let committees: CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
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
                };
            }),
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let publicNotify: PublicNotify = await new Parse.Query(PublicNotify).get(_input.publicNotifyId).catch((e) => {
            throw e;
        });

        publicNotify.setValue('date', _input.date);
        publicNotify.setValue('title', _input.title);
        publicNotify.setValue('content', _input.content);

        await publicNotify.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        if (_input.attachment && _input.extension) {
            console.log(123);
            let attachmentSrc: string = `files/${publicNotify.id}_notify_${publicNotify.createdAt.getTime()}.${_input.extension}`;
            File.WriteBase64File(`${File.assetsPath}/${attachmentSrc}`, _input.attachment);
        }

        return new Date();
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _publicNotifyIds: string[] = [].concat(data.parameters.publicNotifyIds);

        _publicNotifyIds = _publicNotifyIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _publicNotifyIds.map((value, index, array) => {
            return new Parse.Query(PublicNotify).get(value);
        });
        let publicNotifys: PublicNotify[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicNotifys.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        publicNotifys.forEach((value, index, array) => {
            File.DeleteFile(`${File.assetsPath}/${value.getValue('attachmentSrc')}`);
        });

        return new Date();
    },
);
