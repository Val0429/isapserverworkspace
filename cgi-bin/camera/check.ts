import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { PeopleCounting, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ICamera.ICheck;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            try {
                if (_input.type === Enum.ECameraType.hanwha) {
                    let nvr: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
                    nvr.config = _input.config;
                    nvr.Initialization();
                    let nvrVersion: string = await nvr.GetVersion();
                }
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
