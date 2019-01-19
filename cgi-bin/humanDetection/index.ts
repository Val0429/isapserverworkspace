import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { HumanDetection, IRequest, IResponse } from '../../custom/models';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IHumanDetection.IIndexR & IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IHumanDetection.IData[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _count: number = _input.count || 100;
        let _page: number = _input.page || 1;

        let total: number = await new Parse.Query(HumanDetection).count();

        let query: Parse.Query<HumanDetection> = new Parse.Query(HumanDetection);
        if (_input.type !== null && _input.type !== undefined) {
            query.equalTo('source', _input.type);
        }
        query.skip(_count * (_page - 1)).limit(_count);

        let humanDetections: HumanDetection[] = await query.find();

        let content: IResponse.IHumanDetection.IData[] = humanDetections.map((value, index, array) => {
            return {
                objectId: value.id,
                name: `Camera_${value.getValue('nvr')}_${value.getValue('channel')}`,
                count: value.getValue('locations').length,
                source: value.getValue('source'),
                src: value.getValue('src'),
                date: value.getValue('date'),
            };
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: content,
        };
    },
);
