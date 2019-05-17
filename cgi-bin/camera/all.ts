import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.ICamera.IAll;

type OutputR = IResponse.ICamera.IAll[];

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera);

            if (_input.mode || _input.mode === 0) {
                query.equalTo('mode', _input.mode);
            }

            let total: number = await query.count();

            let cameras: IDB.Camera[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return cameras.map((value, index, array) => {
                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);