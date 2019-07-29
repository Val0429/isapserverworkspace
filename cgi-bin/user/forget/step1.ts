import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Email } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IForgetStep1;

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
                .equalTo('username', _input.username)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!user) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('user', user)
                .equalTo('email', _input.email)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!info) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let setting = DataCenter.emailSetting$.value;

            let email: Email = new Email();
            email.config = {
                host: setting.host,
                port: setting.port,
                email: setting.email,
                password: setting.password,
            };

            email.Initialization();

            let verification: string = Utility.RandomText(50, { symbol: false });
            let expireDate: Date = new Date();
            expireDate = new Date(expireDate.setHours(expireDate.getHours() + Config.expired.userForgetVerificationHour));

            let title: string = 'Forget Password';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${info.getValue('name')},</h3>
                    <h4>As your request, your password will be reset. Please click below link and fill in temporary verification key to change your password.</h4>
                    <h4>Temporary verification key: <span style='color:red;'>${verification}</span></h4>
                    <h4>Please note that temporary verification key will be invalid after 1 hour.</h4>
                </div>`;

            let result = await email.Send(title, content, {
                tos: [_input.email],
            });

            info.setValue('forgetVerification', verification);
            info.setValue('forgetExpireDate', expireDate);

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
