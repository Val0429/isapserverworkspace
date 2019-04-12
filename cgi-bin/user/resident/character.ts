import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IResidentCharacter;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let user: Parse.User = new Parse.User();
        user.id = _input.userId;
        let residentInfo: IDB.CharacterResidentInfo = await new Parse.Query(IDB.CharacterResidentInfo)
            .equalTo('user', user)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!residentInfo) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident info not found']);
        }
        if (residentInfo.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident info was deleted']);
        }

        residentInfo.setValue('character', _input.character);

        await residentInfo.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);
