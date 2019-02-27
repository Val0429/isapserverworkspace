import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicArticle } from '../../custom/models';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<PublicArticle> = new Parse.Query(PublicArticle);

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let articles: PublicArticle[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        return articles.map((value, index, array) => {
            return {
                publicArticleId: value.id,
                name: value.getValue('name'),
                lessCount: value.getValue('adjustCount') - value.getValue('lendCount'),
            };
        });
    },
);
