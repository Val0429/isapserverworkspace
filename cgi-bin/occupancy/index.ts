import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Humans, IRequest, IResponse } from '../../custom/models';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IOccupancy.IIndexR & IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IOccupancy.IData[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _count: number = _input.count || 100;
        let _page: number = _input.page || 1;

        let total: number = await new Parse.Query(Humans).count();

        let query: Parse.Query<Humans> = new Parse.Query(Humans);
        if (_input.type !== null && _input.type !== undefined) {
            query.equalTo('source', _input.type);
        }
        query.skip(_count * (_page - 1)).limit(_count);

        let humanss: Humans[] = await query.find();

        let datas: IResponse.IOccupancy.IData[] = humanss.map((value, index, array) => {
            return {
                objectId: value.id,
                name: `Camera_${value.getValue('nvr')}_${value.getValue('channel')}`,
                count: value.getValue('locations').length,
                source: value.getValue('source'),
                src: `${Config.humanDetection.output.path}/${value.getValue('src')}`,
                date: value.getValue('date'),
            };
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: datas,
        };
    },
);
