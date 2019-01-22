import { IUser, Action, Restful, RoleList, Errors, Parse, Socket } from 'core/cgi-package';
import { HumanDetection, IRequest, IResponse, IWs } from '../../custom/models';
import * as Rx from 'rxjs';
import { Config } from 'core/config.gen';
import { Print } from 'workspace/custom/helpers';

export const pulling: Rx.Subject<{}> = new Rx.Subject();

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

    let isLive: boolean = true;

    pulling.subscribe({
        next: async () => {
            let chart: IRequest.IHumanDetection.IChartR = {
                type: _type,
            };

            if (isLive) {
                _socket.send(await GetGroup(chart));
            }
        },
    });

    _socket.io.on('message', async (data) => {
        let _input: IWs<any> = JSON.parse(data);

        if (_input.type === 'mode') {
            let _content: boolean = _input.content;

            isLive = _content;
        } else if (_input.type === 'search') {
            let _content: IRequest.IHumanDetection.IChartR = _input.content;

            _type = _content.type;
            _socket.send(await GetGroup(_content));
        }
    });
});

/**
 * Get group data
 * @param input
 */
async function GetGroup(input: IRequest.IHumanDetection.IChartR): Promise<IResponse.IHumanDetection.IChartR[]> {
    let _count: number = input.count || 10;
    let _date: Date = new Date(input.date || new Date());

    let humanDetections: HumanDetection[] = await new Parse.Query(HumanDetection)
        .lessThanOrEqualTo('date', _date)
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

    let last: Date = await GetLastDate();
    if (last !== undefined && _date > last) {
        while (true) {
            let date: Date = new Date(new Date(dates[0]).setSeconds(dates[0].getSeconds() + Config.humanDetection.intervalSecond));
            if (date > _date) {
                break;
            }

            dates.unshift(date);
        }
    }

    for (let i: number = dates.length; i < _count; i++) {
        let date: Date = i === 0 ? new Date(_date) : new Date(new Date(dates[i - 1]).setSeconds(dates[i - 1].getSeconds() - Config.humanDetection.intervalSecond));
        dates.push(date);
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
                date: new Date(_date),
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
            date: value.date,
            datas: [],
        };
    });

    for (let i: number = 0; i < dates.length; i++) {
        output = output.map((value, index, array) => {
            let data = groups[index].datas.find((value, index, array) => {
                return dates[i] !== undefined && value.date.getTime() === dates[i].getTime();
            });
            data = data || {
                objectId: '',
                count: 0,
                source: input.type,
                src: '',
                date: dates[i],
            };

            value.datas.push(data);
            return value;
        });
    }

    if (output.length === 0) {
        output.push({
            name: '',
            date: new Date(_date),
            datas: dates.map((value, index, array) => {
                return {
                    objectId: '',
                    count: 0,
                    source: input.type,
                    src: '',
                    date: value,
                };
            }),
        });
    }

    output = output.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
    });

    return output;
}

/**
 * Get last date
 */
async function GetLastDate(): Promise<Date> {
    let last: HumanDetection[] = await new Parse.Query(HumanDetection)
        .ascending('date')
        .limit(1)
        .find();
    let lastDate: Date = undefined;
    if (last.length > 0) {
        lastDate = last[0].getValue('date');
    }

    return lastDate;
}
