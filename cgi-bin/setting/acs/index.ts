import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.IACSR;

action.get(
    {
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.acsSetting$.value;

            return setting;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ISetting.IACSU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            if (_input.staffCardRange.min >= _input.staffCardRange.max) {
                throw Errors.throw(Errors.CustomBadRequest, ['staff card range min can not larger or equal than max']);
            }
            if (_input.visitorCardRange.min >= _input.visitorCardRange.max) {
                throw Errors.throw(Errors.CustomBadRequest, ['visitor card range min can not larger or equal than max']);
            }
            if ((_input.visitorCardRange.min <= _input.staffCardRange.min && _input.staffCardRange.min <= _input.visitorCardRange.max) || (_input.staffCardRange.min <= _input.visitorCardRange.min && _input.visitorCardRange.min <= _input.staffCardRange.max)) {
                throw Errors.throw(Errors.CustomBadRequest, ['range can not cross']);
            }

            DataCenter.acsSetting$.next({
                staffCardRange: _input.staffCardRange,
                visitorCardRange: _input.visitorCardRange,
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
