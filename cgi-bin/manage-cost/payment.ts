import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IManageCost.IPayment;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let manageCost: IDB.ManageCost = await new Parse.Query(IDB.ManageCost).get(_input.manageCostId).fail((e) => {
                throw e;
            });
            if (!manageCost) {
                throw Errors.throw(Errors.CustomBadRequest, ['manage cost is not found']);
            }
            if (_input.cost <= 0) {
                throw Errors.throw(Errors.CustomBadRequest, ['amount error']);
            }
            if (manageCost.getValue('balance') < _input.cost) {
                throw Errors.throw(Errors.CustomBadRequest, ['large amount of money payable']);
            }

            manageCost.setValue('charger', data.user);
            manageCost.setValue('balance', manageCost.getValue('balance') - _input.cost);
            manageCost.setValue('status', manageCost.getValue('balance') === 0 ? Enum.ReceiveStatus.received : Enum.ReceiveStatus.unreceived);

            await manageCost.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: manageCost.getValue('resident'),
                type: Enum.MessageType.manageCostPayment,
                data: manageCost,
                message: {
                    YYYYMM: manageCost.getValue('date'),
                    cost: _input.cost,
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
