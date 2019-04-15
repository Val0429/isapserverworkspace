import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ICommunity.IIndexC;

type OutputC = IResponse.ICommunity.IIndexC;

action.post(
    {
        inputType: 'InputC',
        loginRequired: false,
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let community: IDB.Community = await new Parse.Query(IDB.Community)
                .equalTo('name', _input.name)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (community) {
                throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
            }

            community = new IDB.Community();

            community.setValue('name', _input.name);
            community.setValue('address', _input.address);

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role)
                .equalTo('name', RoleList.Chairman)
                .find()
                .fail((e) => {
                    throw e;
                });

            let user: Parse.User = new Parse.User();

            user.setUsername(_input.userAccount);
            user.setPassword(_input.userPassword);
            user.set('roles', roles);

            await user.signUp(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            await community.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let committee: IDB.CharacterCommittee = new IDB.CharacterCommittee();

            committee.setValue('user', user);
            committee.setValue('name', _input.userName);
            committee.setValue('community', community);
            committee.setValue('permission', '');
            committee.setValue('adjustReason', '');
            committee.setValue('isDeleted', false);

            await committee.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                userId: user.id,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ICommunity.IIndexR;

action.get(
    {
        loginRequired: true,
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let committee: IDB.CharacterCommittee = await new Parse.Query(IDB.CharacterCommittee)
                .equalTo('user', data.user)
                .include('community')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!committee) {
                throw Errors.throw(Errors.CustomBadRequest, ['committee not found']);
            }

            return {
                name: committee.getValue('community').getValue('name'),
                address: committee.getValue('community').getValue('address'),
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
