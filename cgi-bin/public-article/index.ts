import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicArticle, CharacterCommittee } from '../../custom/models';
import { Db } from '../../custom/helpers';

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

        let publicArticle: PublicArticle = new PublicArticle();

        publicArticle.setValue('creator', data.user);
        publicArticle.setValue('community', _userInfo.community);
        publicArticle.setValue('name', _input.name);
        publicArticle.setValue('type', _input.type);
        publicArticle.setValue('defaultCount', _input.defaultCount);
        publicArticle.setValue('adjustCount', _input.defaultCount);
        publicArticle.setValue('adjustReason', '');
        publicArticle.setValue('adjuster', data.user);
        publicArticle.setValue('lendCount', 0);

        await publicArticle.save(null, { useMasterKey: true }).catch((e) => {
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

        let query: Parse.Query<PublicArticle> = new Parse.Query(PublicArticle).equalTo('community', _userInfo.community);
        if (_input.type) {
            query.equalTo('type', _input.type);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let publicArticlea: PublicArticle[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = publicArticlea.map((value, index, array) => {
            return new Parse.Query(CharacterCommittee).equalTo('user', value.getValue('adjuster')).first();
        });
        let committees: CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
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

        let publicArticle: PublicArticle = await new Parse.Query(PublicArticle).get(_input.publicArticleId).catch((e) => {
            throw e;
        });
        if (!publicArticle) {
            throw Errors.throw(Errors.CustomBadRequest, ['public article not found']);
        }

        publicArticle.setValue('name', _input.name);
        publicArticle.setValue('adjustCount', _input.adjustCount);
        publicArticle.setValue('adjustReason', _input.adjustReason);
        publicArticle.setValue('adjuster', data.user);

        await publicArticle.save(null, { useMasterKey: true }).catch((e) => {
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

        let tasks: Promise<any>[] = _publicArticleIds.map((value, index, array) => {
            return new Parse.Query(PublicArticle).get(value);
        });
        let publicArticles: PublicArticle[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicArticles.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
