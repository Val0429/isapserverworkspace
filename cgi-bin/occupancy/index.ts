import { IUser, Action, Restful, RoleList, Errors, Parse, Socket } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Humans, HumansSummary, IRequest, IResponse, IWs } from '../../custom/models';
import { Print, DateTime } from 'workspace/custom/helpers';
import * as Rx from 'rxjs';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IOccupancy.IIndexR & IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IOccupancy.IIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _count: number = _input.count || 100;
        let _page: number = _input.page || 1;

        let total: number = await GetTotalCount(Humans);

        let query: Parse.Query<Humans> = new Parse.Query(Humans);
        if (_input.analyst !== null && _input.analyst !== undefined) {
            query.equalTo('analyst', _input.analyst);
        }

        query.skip(_count * (_page - 1)).limit(_count);

        let humanss: Humans[] = await query.find().catch((e) => {
            throw e;
        });

        let datas: IResponse.IOccupancy.IIndexR[] = humanss.map((value, index, array) => {
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
 * Action WebSocket
 */
export const pulling$: Rx.Subject<{}> = new Rx.Subject();

action.ws(async (data) => {
    let _socket: Socket = data.socket;

    let _isLive: boolean = true;
    let _analyst: any = '';
    let _count: number = 0;
    let _type: any = 'none';

    pulling$.subscribe({
        next: async () => {
            if (_isLive) {
                if (_type === 'none') {
                    _socket.send({
                        type: 'searchGroup',
                        content: await GetGroup({
                            analyst: _analyst,
                            count: _count,
                        }),
                    } as IWs<IResponse.IOccupancy.IGroupR[]>);
                } else {
                    _socket.send({
                        type: 'searchSummary',
                        content: await GetSummary({
                            analyst: _analyst,
                            count: _count,
                            type: _type,
                        }),
                    } as IWs<IResponse.IOccupancy.ISummaryR[]>);
                }
            }
        },
    });

    _socket.io.on('message', async (data) => {
        let _input: IWs<any> = JSON.parse(data);

        if (_input.type === 'changeMode') {
            let _content: boolean = _input.content;

            _isLive = _content;
        } else if (_input.type === 'searchGroup') {
            let _content: IRequest.IOccupancy.IGroupR = _input.content;

            _analyst = _content.analyst;
            _count = _content.count;
            _type = 'none';

            _socket.send({
                type: _input.type,
                content: await GetGroup(_content),
            } as IWs<IResponse.IOccupancy.IGroupR[]>);
        } else if (_input.type === 'searchSummary') {
            let _content: IRequest.IOccupancy.ISummaryR = _input.content;

            _analyst = _content.analyst;
            _count = _content.count;
            _type = _content.type;

            _socket.send({
                type: _input.type,
                content: await GetSummary(_content),
            } as IWs<IResponse.IOccupancy.ISummaryR[]>);
        }
    });
});

/**
 * Get last date
 */
export async function GetLastDate<T extends Function>(table: T): Promise<Date> {
    try {
        let last: Parse.Object = await new Parse.Query(table.name)
            .descending('date')
            .first()
            .catch((e) => {
                throw e;
            });
        let lastDate: Date = undefined;
        if (last !== undefined || last !== null) {
            lastDate = last.get('date');
        }

        return lastDate;
    } catch (e) {
        throw e;
    }
}

/**
 * Get total count
 */
export async function GetTotalCount<T extends Function>(table: T): Promise<number> {
    try {
        let total: number = await new Parse.Query(table.name).count().catch((e) => {
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
export async function GetCameraCount<T extends Function>(table: T): Promise<number> {
    try {
        let count: any = await new Parse.Query(table.name).distinct('camera');

        return count.length;
    } catch (e) {
        throw e;
    }
}

/**
 * Generate dates
 * @param now
 * @param datas
 * @param count
 * @param type
 */
export async function GenerateDates<T extends Parse.Object>(now: Date, datas: T[], count: number, type?: 'month' | 'day' | 'hour'): Promise<Date[]> {
    try {
        let dates: Date[] = [];
        for (let i: number = 0; i < datas.length; i++) {
            let date: Date = datas[i].get('date');

            if (dates.map(Number).indexOf(date.getTime()) < 0) {
                dates.push(date);
            }
        }

        let last: Date = type === null || type === undefined ? await GetLastDate(Humans) : await GetLastDate(HumansSummary);
        if (last !== undefined && now > last) {
            while (true) {
                let date: Date = new Date(new Date(dates[0] || new Date()));
                if (type === null || type === undefined) {
                    date = new Date(date.setSeconds(date.getSeconds() + Config.humanDetection.intervalSecond));
                } else if (type === 'month') {
                    date = new Date(date.setMonth(date.getMonth() + 1));
                } else if (type === 'day') {
                    date = new Date(date.setDate(date.getDate() + 1));
                } else if (type === 'hour') {
                    date = new Date(date.setHours(date.getHours() + 1));
                }

                if (date > now) {
                    break;
                }

                dates.unshift(date);
            }
        }

        for (let i: number = dates.length; i < count; i++) {
            let date: Date = i === 0 ? new Date(now) : new Date(dates[i - 1]);

            if (i !== 0) {
                if (type === null || type === undefined) {
                    date = new Date(date.setSeconds(date.getSeconds() - Config.humanDetection.intervalSecond));
                } else if (type === 'month') {
                    date = new Date(date.setMonth(date.getMonth() - 1));
                } else if (type === 'day') {
                    date = new Date(date.setDate(date.getDate() - 1));
                } else if (type === 'hour') {
                    date = new Date(date.setHours(date.getHours() - 1));
                }
            }

            dates.push(date);
        }

        dates.length = count;
        dates = dates.reverse();

        return dates;
    } catch (e) {
        throw e;
    }
}

/**
 * Get group data
 * @param input
 */
export async function GetGroup(input: IRequest.IOccupancy.IGroupR): Promise<IResponse.IOccupancy.IGroupR[]> {
    try {
        let _count: number = input.count || 10;
        let _date: Date = new Date(input.date || new Date());

        let cameraCount: number = await GetCameraCount(Humans);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(new Date(_date).setSeconds(_date.getSeconds() - _count * Config.humanDetection.intervalSecond));

        let humanss: Humans[] = await new Parse.Query(Humans)
            .lessThanOrEqualTo('date', _date)
            .greaterThanOrEqualTo('date', min)
            .equalTo('analyst', input.analyst)
            .descending('date')
            .limit(limit)
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = await GenerateDates(_date, humanss, _count);

        let groups: IResponse.IOccupancy.IGroupR[] = humanss.reduce<IResponse.IOccupancy.IGroupR[]>((previousValue, currentValue, currentIndex, array) => {
            let cameras: string[] = previousValue.map((value, index, array) => {
                return value.camera;
            });

            let data: IResponse.IOccupancy.IGroupR_Data = {
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

        let outputs: IResponse.IOccupancy.IGroupR[] = groups.map((value, index, array) => {
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

/**
 * Get summary data
 * @param input
 */
export async function GetSummary(input: IRequest.IOccupancy.ISummaryR): Promise<IResponse.IOccupancy.ISummaryR[]> {
    try {
        let _count: number = input.count || 10;
        let _date: Date = new Date(input.date || new Date());

        let cameraCount: number = await GetCameraCount(HumansSummary);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(_date);

        if (input.type === 'month') {
            min = new Date(min.setMonth(min.getMonth() - _count));
        } else if (input.type === 'day') {
            min = new Date(min.setDate(min.getDate() - _count));
        } else if (input.type === 'hour') {
            min = new Date(min.setHours(min.getHours() - _count));
        }

        let humansSummarys: HumansSummary[] = await new Parse.Query(HumansSummary)
            .lessThanOrEqualTo('date', _date)
            .greaterThanOrEqualTo('date', min)
            .equalTo('analyst', input.analyst)
            .equalTo('type', input.type)
            .descending('date')
            .limit(limit)
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = await GenerateDates(_date, humansSummarys, _count, input.type);

        let summarys: IResponse.IOccupancy.ISummaryR[] = humansSummarys.reduce<IResponse.IOccupancy.ISummaryR[]>((previousValue, currentValue, currentIndex, array) => {
            let cameras: string[] = previousValue.map((value, index, array) => {
                return value.camera;
            });

            let data: IResponse.IOccupancy.ISummaryR_Data = {
                objectId: currentValue.id,
                total: currentValue.getValue('total'),
                analyst: currentValue.getValue('analyst'),
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

        let outputs: IResponse.IOccupancy.ISummaryR[] = summarys.map((value, index, array) => {
            return {
                camera: value.camera,
                date: value.date,
                datas: [],
            };
        });

        for (let i: number = 0; i < dates.length; i++) {
            outputs = outputs.map((value, index, array) => {
                let data = summarys[index].datas.find((value, index, array) => {
                    return dates[i] !== undefined && value.date.getTime() === dates[i].getTime();
                });
                data = data || {
                    objectId: '',
                    total: 0,
                    analyst: input.analyst,
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
                        total: 0,
                        analyst: input.analyst,
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
