import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo } from '../../../custom/models';
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
        let _input: InputR = data.inputType;

        let user = await UserHelper.login({
            username: _input.account,
            password: _input.password,
        }).catch((e) => {
            throw e;
        });

        let event: EventLogin = new EventLogin({
            owner: user.user,
        });
        await Events.save(event).catch((e) => {
            throw e;
        });

        let residentInfo: CharacterResidentInfo = await new Parse.Query(CharacterResidentInfo)
            .equalTo('user', user.user)
            .include('resident')
            .first()
            .catch((e) => {
                throw e;
            });
        if (!residentInfo) {
            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
        }

        return {
            sessionId: user.sessionId,
            residentId: residentInfo.id,
            userId: user.user.id,
            name: residentInfo.getValue('name'),
            gender: residentInfo.getValue('gender'),
            birthday: residentInfo.getValue('birthday'),
            phone: residentInfo.getValue('phone'),
            lineId: residentInfo.getValue('lineId'),
            email: residentInfo.getValue('email'),
            education: residentInfo.getValue('education'),
            career: residentInfo.getValue('career'),
            barcode: Parser.Base64Str2HtmlSrc(Draw.Barcode(residentInfo.getValue('resident').getValue('barcode'), 0.5, 25).toString(Parser.Encoding.base64)),
        };
    },
);
