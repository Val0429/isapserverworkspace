import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IPublicArticle.IAll[];

action.get(
    {
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let query: Parse.Query<IDB.PublicArticle> = new Parse.Query(IDB.PublicArticle).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let articles: IDB.PublicArticle[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return articles.map((value, index, array) => {
                return {
                    publicArticleId: value.id,
                    name: value.getValue('name'),
                    type: value.getValue('type'),
                    lessCount: value.getValue('adjustCount') - value.getValue('lendCount'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
