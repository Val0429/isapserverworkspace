import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Email } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { Login } from '../user/login';
import { default as DataCenter } from '../../../custom/services/data-center';

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

            let setting = DataCenter.emailSetting$.value;

            let email: Email = new Email();
            email.config = {
                host: setting.host,
                port: setting.port,
                email: setting.email,
                password: setting.password,
            };

            email.Initialization();

            let ips: Utility.INetwork[] = Utility.GetNetwork();
            let url: string = DataCenter.systemSetting$.value.hosting ? DataCenter.systemSetting$.value.hosting : `http${Config.core.httpsEnabled ? 's' : ''}://${ips[0].address}:${Config.core.httpsEnabled ? Config.core.httpsPort : Config.core.port}`;

            let title: string = 'Action required to activate membership & change password for BAR system';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${info.getValue('name')},</h3>
                    <h4>BAR System sends this message to remind you to activate account by visiting below url.</h4>
                    <h4><a href="${url}/verify?t=${info.getValue('enableVerification')}">${url}</a></h4>
                    <h4>Your username is ${info.getValue('account')}</h4>
                    <h4>Your activation ID is <span style='color:red;'>${info.getValue('enableVerification')}</span></h4>
                    <h4>If you are still having problems, please contact BAR system administrator.</h4>
                    <h4>All the best,</h4>
                    <h4>BAR system</h4>
                </div>`;

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
