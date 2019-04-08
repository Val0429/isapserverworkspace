import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ICamera.IAll[];

action.get(
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera).equalTo('isDeleted', false);

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let cameras: IDB.Camera[] = await query
            .limit(total)
            .find()
            .fail((e) => {
                throw e;
            });

        return cameras.map((value, index, array) => {
            return {
                cameraId: value.id,
                name: value.getValue('name'),
            };
        });
    },
);
