import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Draw, Parser } from '../../../custom/helpers';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Login
 */
type InputR = IRequest.IUser.IBaseLogin;

type OutputR = IResponse.IUser.IResidentLogin;

action.post(
    {
        inputType: 'InputR',
        loginRequired: false,
        permission: [],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let user = await UserHelper.login({
                username: _input.account,
                password: _input.password,
            }).catch((e) => {
                throw e;
            });

            let roles = user.user.get('roles').map((value, index, array) => {
                return Object.keys(RoleList).find((value1, index1, array1) => {
                    return value.get('name') === RoleList[value1];
                });
            });

            if (!(roles.indexOf('Resident') > -1)) {
                throw Errors.throw(Errors.LoginFailed);
            }

            let event: EventLogin = new EventLogin({
                owner: user.user,
            });
            await Events.save(event).catch((e) => {
                throw e;
            });

            let residentInfo: IDB.CharacterResidentInfo = await new Parse.Query(IDB.CharacterResidentInfo)
                .equalTo('user', user.user)
                .include(['resident', 'community'])
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!residentInfo) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }
            if (residentInfo.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident info was deleted']);
            }

            return {
                sessionId: user.sessionId,
                residentId: residentInfo.getValue('resident').id,
                userId: user.user.id,
                name: residentInfo.getValue('name'),
                gender: residentInfo.getValue('gender'),
                birthday: residentInfo.getValue('birthday'),
                phone: residentInfo.getValue('phone'),
                lineId: residentInfo.getValue('lineId'),
                email: residentInfo.getValue('email'),
                education: residentInfo.getValue('education'),
                career: residentInfo.getValue('career'),
                character: residentInfo.getValue('character'),
                isEmail: residentInfo.getValue('isEmail'),
                isNotice: residentInfo.getValue('isNotice'),
                barcode: Parser.Base64Str2HtmlSrc(Draw.Barcode(residentInfo.getValue('resident').getValue('barcode'), 0.5, true, 25).toString(Parser.Encoding.base64)),
                communityName: residentInfo.getValue('community').getValue('name'),
                communityAddress: residentInfo.getValue('community').getValue('address'),
                deviceToken: residentInfo.getValue('deviceToken'),
                deviceType: residentInfo.getValue('deviceType'),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
