import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Email } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { Login } from '../user/login';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IResend;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let user: Parse.User = await new Parse.Query(Parse.User)
                .equalTo('objectId', _input.objectId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!user) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('user', user)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!info) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let now: Date = new Date();

            info.setValue('enableVerification', Utility.RandomText(30, { symbol: false }));
            info.setValue('enableExpireDate', new Date(new Date(now.setDate(now.getDate() + Config.expired.userEnableVerificationHour))));

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let email: Email = new Email();
            email.config = {
                host: Config.email.host,
                port: Config.email.port,
                email: Config.email.email,
                password: Config.email.password,
            };

            email.Initialization();

            let title: string = 'Action required to activate membership & change password for BAR system';
            let content: string = info.getValue('enableVerification');

            let result = await email.Send(title, content, {
                tos: [info.getValue('email')],
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
