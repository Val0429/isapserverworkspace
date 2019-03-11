import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, CharacterCommittee } from '../../../custom/models';
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

type OutputR = IResponse.IUser.ICommitteeLogin;

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

        let roles = user.user.get('roles').map((value, index, array) => {
            return Object.keys(RoleList).find((value1, index1, array1) => {
                return value.get('name') === RoleList[value1];
            });
        });

        if (!(roles.indexOf('Chairman') > -1 || roles.indexOf('DeputyChairman') > -1 || roles.indexOf('FinanceCommittee') > -1 || roles.indexOf('DirectorGeneral') > -1 || roles.indexOf('Guard') > -1)) {
            throw Errors.throw(Errors.LoginFailed);
        }

        let event: EventLogin = new EventLogin({
            owner: user.user,
        });
        await Events.save(event).catch((e) => {
            throw e;
        });

        let committee: CharacterCommittee = await new Parse.Query(CharacterCommittee)
            .equalTo('user', user.user)
            .include(['community'])
            .first()
            .catch((e) => {
                throw e;
            });
        if (!committee) {
            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
        }
        if (committee.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['committee was deleted']);
        }

        return {
            sessionId: user.sessionId,
            userId: user.user.id,
            roles: roles,
            serverTime: new Date(),
            communityName: committee.getValue('community').getValue('name'),
            communityAddress: committee.getValue('community').getValue('address'),
        };
    },
);
