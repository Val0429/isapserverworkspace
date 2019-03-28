import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IVisitor.ILeave;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let visitor: IDB.Visitor = await new Parse.Query(IDB.Visitor).get(_input.visitorId).catch((e) => {
            throw e;
        });
        if (!visitor) {
            throw Errors.throw(Errors.CustomBadRequest, ['visitor not found']);
        }
        if (visitor.getValue('leaveDate')) {
            throw Errors.throw(Errors.CustomBadRequest, ['visitor was leaved']);
        }

        visitor.setValue('leaveDate', new Date());

        await visitor.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: visitor.getValue('resident'),
            type: Enum.MessageType.visitorLeave,
            data: visitor,
            message: {
                visitor: visitor.getValue('name'),
            },
        });

        return new Date();
    },
);
