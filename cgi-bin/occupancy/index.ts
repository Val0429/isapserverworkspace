import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Humans, IRequest, IResponse } from '../../custom/models';
import { Print } from 'workspace/custom/helpers';

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

        let total: number = await GetTotalCount();

        let query: Parse.Query<Humans> = new Parse.Query(Humans);
        if (_input.analyst !== null && _input.analyst !== undefined) {
            query.equalTo('analyst', _input.analyst);
        }

        query.skip(_count * (_page - 1)).limit(_count);

        let humanss: Humans[] = await query.find();

        let datas: IResponse.IOccupancy.IData[] = humanss.map((value, index, array) => {
            return {
                objectId: value.id,
                analyst: value.getValue('analyst'),
                camera: value.getValue('camera'),
                count: value.getValue('locations').length,
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

/**
 * Get last date
 */
export async function GetLastDate(): Promise<Date> {
    try {
        let last: Humans[] = await new Parse.Query(Humans)
            .ascending('date')
            .limit(1)
            .find()
            .catch((e) => {
                throw e;
            });
        let lastDate: Date = undefined;
        if (last.length > 0) {
            lastDate = last[0].getValue('date');
        }

        return lastDate;
    } catch (e) {
        throw e;
    }
}

/**
 * Get total count
 */
export async function GetTotalCount(): Promise<number> {
    try {
        let total: number = await new Parse.Query(Humans).count().catch((e) => {
            throw e;
        });

        return total;
    } catch (e) {
        throw e;
    }
}

/**
 * Get camera count
 */
export async function GetCameraCount(): Promise<number> {
    try {
        let count: any = await new Parse.Query(Humans).distinct('camera');

        return count.length;
    } catch (e) {
        throw e;
    }
}

/**
 * Get group data
 * @param input
 */
export async function GetGroup(input: IRequest.IOccupancy.IChartR): Promise<IResponse.IOccupancy.IChartR[]> {
    try {
        let _count: number = input.count || 10;
        let _date: Date = new Date(input.date || new Date());

        let cameraCount: number = await GetCameraCount();

        let humanss: Humans[] = await new Parse.Query(Humans)
            .lessThanOrEqualTo('date', _date)
            .equalTo('analyst', input.analyst)
            .descending('date')
            .limit(_count * (cameraCount + 1))
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = [];
        for (let i: number = 0; i < humanss.length; i++) {
            let date: Date = humanss[i].getValue('date');

            if (dates.map(Number).indexOf(date.getTime()) < 0) {
                dates.push(date);
            }
        }

        let last: Date = await GetLastDate();
        if (last !== undefined && _date > last) {
            while (true) {
                let date: Date = new Date(new Date(dates[0] || new Date()).setSeconds((dates[0] || new Date()).getSeconds() + Config.humanDetection.intervalSecond));
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

        let groups: IResponse.IOccupancy.IChartR[] = humanss.reduce<IResponse.IOccupancy.IChartR[]>((previousValue, currentValue, currentIndex, array) => {
            let cameras: string[] = previousValue.map((value, index, array) => {
                return value.camera;
            });

            let data: IResponse.IOccupancy.IData = {
                objectId: currentValue.id,
                count: currentValue.getValue('locations').length,
                analyst: currentValue.getValue('analyst'),
                src: `${Config.humanDetection.output.path}/${currentValue.getValue('src')}`,
                date: currentValue.getValue('date'),
            };

            let index: number = cameras.indexOf(currentValue.getValue('camera'));
            if (index < 0) {
                previousValue.push({
                    camera: currentValue.getValue('camera'),
                    date: new Date(_date),
                    datas: [data],
                });
            } else {
                previousValue[index].datas.push(data);
            }

            return previousValue;
        }, []);

        let outputs: IResponse.IOccupancy.IChartR[] = groups.map((value, index, array) => {
            return {
                camera: value.camera,
                date: value.date,
                datas: [],
            };
        });

        for (let i: number = 0; i < dates.length; i++) {
            outputs = outputs.map((value, index, array) => {
                let data = groups[index].datas.find((value, index, array) => {
                    return dates[i] !== undefined && value.date.getTime() === dates[i].getTime();
                });
                data = data || {
                    objectId: '',
                    count: 0,
                    analyst: input.analyst,
                    src: '',
                    date: dates[i],
                };

                value.datas.push(data);
                return value;
            });
        }

        if (outputs.length === 0) {
            outputs.push({
                camera: '',
                date: new Date(_date),
                datas: dates.map((value, index, array) => {
                    return {
                        objectId: '',
                        count: 0,
                        analyst: input.analyst,
                        src: '',
                        date: value,
                    };
                }),
            });
        }

        outputs = outputs.sort((a, b) => {
            return a.camera > b.camera ? 1 : -1;
        });

        return outputs;
    } catch (e) {
        throw e;
    }
}
