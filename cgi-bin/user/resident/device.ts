import { IUser, Action, Restful, RoleList, Errors, ParseObject, ActionParam } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IResidentDevice;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        loginRequired: true,
        permission: [RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        if (!_userInfo.residentInfo) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident info not found']);
        }
        if (_userInfo.residentInfo.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident info was deleted']);
        }

        _userInfo.residentInfo.setValue('deviceToken', _input.deviceToken);
        _userInfo.residentInfo.setValue('deviceType', _input.deviceType);

        await _userInfo.residentInfo.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);
