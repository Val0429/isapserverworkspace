import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicArticle.IIndexC;

type OutputC = IResponse.IPublicArticle.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let publicArticle: IDB.PublicArticle = new IDB.PublicArticle();

        publicArticle.setValue('creator', data.user);
        publicArticle.setValue('community', _userInfo.community);
        publicArticle.setValue('name', _input.name);
        publicArticle.setValue('type', _input.type);
        publicArticle.setValue('defaultCount', _input.defaultCount);
        publicArticle.setValue('adjustCount', _input.defaultCount);
        publicArticle.setValue('adjustReason', '');
        publicArticle.setValue('adjuster', data.user);
        publicArticle.setValue('lendCount', 0);
        publicArticle.setValue('isDeleted', false);

        await publicArticle.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return {
            publicArticleId: publicArticle.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPublicArticle.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IPublicArticle.IIndexR[]>;

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

        let query: Parse.Query<IDB.PublicArticle> = new Parse.Query(IDB.PublicArticle).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
        if (_input.type) {
            query.equalTo('type', _input.type);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let publicArticlea: IDB.PublicArticle[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .fail((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = publicArticlea.map<any>((value, index, array) => {
            return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value.getValue('adjuster')).first();
        });
        let committees: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: publicArticlea.map((value, index, array) => {
                return {
                    publicArticleId: value.id,
                    date: value.createdAt,
                    name: value.getValue('name'),
                    type: value.getValue('type'),
                    defaultCount: value.getValue('defaultCount'),
                    adjustCount: value.getValue('adjustCount'),
                    adjustReason: value.getValue('adjustReason'),
                    adjusterName: committees[index] ? committees[index].getValue('name') : '',
                    lendCount: value.getValue('lendCount'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPublicArticle.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let publicArticle: IDB.PublicArticle = await new Parse.Query(IDB.PublicArticle).get(_input.publicArticleId).fail((e) => {
            throw e;
        });
        if (!publicArticle) {
            throw Errors.throw(Errors.CustomBadRequest, ['public article not found']);
        }
        if (publicArticle.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['public article was deleted']);
        }

        publicArticle.setValue('name', _input.name);
        publicArticle.setValue('adjustCount', _input.adjustCount);
        publicArticle.setValue('adjustReason', _input.adjustReason);
        publicArticle.setValue('adjuster', data.user);

        await publicArticle.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IPublicArticle.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _publicArticleIds: string[] = [].concat(data.parameters.publicArticleIds);

        _publicArticleIds = _publicArticleIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _publicArticleIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.PublicArticle).get(value);
        });
        let publicArticles: IDB.PublicArticle[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicArticles.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicArticles.map<any>((value, index, array) => {
            return new Parse.Query(IDB.PublicArticleReservation)
                .equalTo('article', value)
                .include('article')
                .find();
        });
        let reservations: IDB.PublicArticleReservation[] = [].concat(
            ...(await Promise.all(tasks).catch((e) => {
                throw e;
            })),
        );
        reservations.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value.getValue('resident'),
                type: Enum.MessageType.publicArticleDelete,
                data: value,
                message: {
                    article: value.getValue('article').getValue('name'),
                },
            });
        });

        return new Date();
    },
);
