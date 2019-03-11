import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo, Parking } from '../../../custom/models';
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

        let resident: CharacterResident = await new Parse.Query(CharacterResident)
            .equalTo('barcode', data.parameters.barcode)
            .first()
            .catch((e) => {
                throw e;
            });

        let residentInfoCount: number = await new Parse.Query(CharacterResidentInfo)
            .equalTo('resident', resident)
            .count()
            .catch((e) => {
                throw e;
            });

        let parkings: Parking[] = await new Parse.Query(Parking)
            .equalTo('resident', resident)
            .find()
            .catch((e) => {
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
