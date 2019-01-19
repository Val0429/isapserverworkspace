import { IUser, Action, Restful, RoleList, Errors, Parse, Socket } from 'core/cgi-package';
import { HumanDetection, IRequest, IResponse } from '../../custom/models';
import { pulling } from '../../custom/services/hd';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IHumanDetection.IChartR;

type OutputR = IResponse.IHumanDetection.IChartR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await GetGroup(data.inputType);
    },
);

/**
 * Action WebSocket
 */
action.ws(async (data) => {
    let _socket: Socket = data.socket;

    let _type: any = '';

    pulling.subscribe({
        next: async () => {
            let chart: IRequest.IHumanDetection.IChartR = {
                type: _type,
            };

            _socket.send(await GetGroup(chart));
        },
    });

    _socket.io.on('message', async (data) => {
        let chart: IRequest.IHumanDetection.IChartR = JSON.parse(data);

        _type = chart.type;
        _socket.send(await GetGroup(chart));
    });
});

/**
 * Get group data
 * @param input
 */
async function GetGroup(input: IRequest.IHumanDetection.IChartR) {
    let _count: number = input.count || 10;
    let _date: Date = input.date || new Date();

    let humanDetections: HumanDetection[] = await new Parse.Query(HumanDetection)
        .lessThanOrEqualTo('date', new Date(_date))
        .equalTo('source', input.type)
        .descending('date')
        .limit(_count * 3)
        .find();

    let dates: Date[] = [];
    for (let i: number = 0; i < humanDetections.length; i++) {
        let date: Date = humanDetections[i].getValue('date');

        if (dates.map(Number).indexOf(date.getTime()) < 0) {
            dates.push(date);
        }
    }

    for (let i: number = dates.length; i < _count; i++) {
        dates.push(undefined);
    }

    dates.length = _count;
    dates = dates.reverse();

    let groups: IResponse.IHumanDetection.IChartR[] = humanDetections.reduce<IResponse.IHumanDetection.IChartR[]>((previousValue, currentValue, currentIndex, array) => {
        let name: string = `Camera_${currentValue.getValue('nvr')}_${currentValue.getValue('channel')}`;

        let names: string[] = previousValue.map((value, index, array) => {
            return value.name;
        });

        let data: IResponse.IHumanDetection.IData = {
            objectId: currentValue.id,
            count: currentValue.getValue('locations').length,
            source: currentValue.getValue('source'),
            src: currentValue.getValue('src'),
            date: currentValue.getValue('date'),
        };

        let index: number = names.indexOf(name);
        if (index < 0) {
            previousValue.push({
                name: name,
                datas: [data],
            });
        } else {
            previousValue[index].datas.push(data);
        }

        return previousValue;
    }, []);

    let output: IResponse.IHumanDetection.IChartR[] = groups.map((value, index, array) => {
        return {
            name: value.name,
            datas: [],
        };
    });

    for (let i: number = 0; i < dates.length; i++) {
        output = output.map((value, index, array) => {
            value.datas.push(
                groups[index].datas.find((value, index, array) => {
                    return dates[i] !== undefined && value.date.getTime() === dates[i].getTime();
                }),
            );
            return value;
        });
    }

    output = output.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
    });

    return output;
}
