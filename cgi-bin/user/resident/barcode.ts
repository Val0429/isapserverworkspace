import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Draw, Parser, Db } from '../../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IUser.IResidentIndexR;

action.get(
    {
        path: '/:barcode',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident)
            .equalTo('barcode', data.parameters.barcode)
            .first()
            .fail((e) => {
                throw e;
            });

        let residentInfoCount: number = await new Parse.Query(IDB.CharacterResidentInfo)
            .equalTo('isDeleted', false)
            .equalTo('resident', resident)
            .count()
            .fail((e) => {
                throw e;
            });

        let parkings: IDB.Parking[] = await new Parse.Query(IDB.Parking)
            .equalTo('resident', resident)
            .find()
            .fail((e) => {
                throw e;
            });
        let parkingCost: number = parkings.reduce((prev, curr, index, array) => {
            return prev + curr.getValue('cost');
        }, 0);

        return {
            residentId: resident.id,
            address: resident.getValue('address'),
            residentCount: residentInfoCount,
            parkingCost: parkingCost,
            manageCost: resident.getValue('manageCost'),
            pointTotal: resident.getValue('pointTotal'),
            pointBalance: resident.getValue('pointBalance'),
            barcode: Parser.Base64Str2HtmlSrc(Draw.Barcode(resident.getValue('barcode'), 0.5, true, 25).toString(Parser.Encoding.base64)),
        };
    },
);
