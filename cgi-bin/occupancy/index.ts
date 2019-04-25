import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB, IWs } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Rx from 'rxjs';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action WebSocket
 */
export const pulling$: Rx.Subject<{}> = new Rx.Subject();

action.ws(async (data) => {
    try {
        let _socket: Socket = data.socket;

        let _isLive: boolean = true;
        let _analyst: any = '';
        let _count: number = 0;
        let _type: any = 'none';

        pulling$.subscribe({
            next: async () => {
                try {
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
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                    throw e;
                }
            },
        });

        _socket.io.on('message', async (data) => {
            try {
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
            } catch (e) {
                Print.Log(e, new Error(), 'error');
                throw e;
            }
        });
    } catch (e) {
        Print.Log(e, new Error(), 'error');
        throw e;
    }
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

        let lastDate: Date = last === undefined || last === null ? new Date() : last.get('date');

        return lastDate;
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
 * @param count
 * @param type
 */
export function GenerateDates(now: Date, count: number, type?: 'month' | 'day' | 'hour'): Date[] {
    try {
        if (type === null || type === undefined) {
            now = new Date(new Date(new Date(now).setMinutes(Math.floor(now.getMinutes() / 5) * 5)).setSeconds(0, 0));
        }

        let dates: Date[] = [];
        for (let i: number = 0; i < count; i++) {
            let date: Date = new Date(i === 0 ? now : dates[0]);

            if (i !== 0) {
                if (type === 'month') {
                    date = new Date(date.setMonth(date.getMonth() - 1));
                } else if (type === 'day') {
                    date = new Date(date.setDate(date.getDate() - 1));
                } else if (type === 'hour') {
                    date = new Date(date.setHours(date.getHours() - 1));
                } else {
                    date = new Date(date.setSeconds(date.getSeconds() - Config.humanDetection.intervalSecond));
                }
            }

            if (type === 'month') {
                date = new Date(new Date(date.setDate(1)).setHours(0, 0, 0, 0));
            } else if (type === 'day') {
                date = new Date(date.setHours(0, 0, 0, 0));
            } else if (type === 'hour') {
                date = new Date(date.setMinutes(0, 0, 0));
            } else {
                date = new Date(date.setSeconds(0, 0));
            }

            dates.unshift(date);
        }

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

        let cameraCount: number = await GetCameraCount(IDB.Humans);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(new Date(_date).setSeconds(_date.getSeconds() - _count * Config.humanDetection.intervalSecond));

        let humanss: IDB.Humans[] = await new Parse.Query(IDB.Humans)
            .equalTo('analyst', input.analyst)
            .lessThanOrEqualTo('date', _date)
            .greaterThan('date', min)
            .descending('date')
            .limit(limit)
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = await GenerateDates(_date, _count);

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
                datas: dates.map((value1, index1, array1) => {
                    let datas: IResponse.IOccupancy.IGroupR_Data[] = value.datas.filter((value2, index2, array2) => {
                        return value2.date.getTime() === value1.getTime();
                    });
                    return {
                        objectId: datas.length > 0 ? datas[0].objectId : '',
                        count: datas.length > 0 ? datas[0].count : 0,
                        analyst: input.analyst,
                        src: datas.length > 0 ? datas[0].src : '',
                        date: value1,
                    };
                }),
            };
        });

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

        let cameraCount: number = await GetCameraCount(IDB.HumansSummary);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(_date);

        if (input.type === 'month') {
            min = new Date(min.setMonth(min.getMonth() - _count));
        } else if (input.type === 'day') {
            min = new Date(min.setDate(min.getDate() - _count));
        } else if (input.type === 'hour') {
            min = new Date(min.setHours(min.getHours() - _count));
        }

        let humansSummarys: IDB.HumansSummary[] = await new Parse.Query(IDB.HumansSummary)
            .equalTo('analyst', input.analyst)
            .equalTo('type', input.type)
            .lessThanOrEqualTo('date', _date)
            .greaterThan('date', min)
            .descending('date')
            .limit(limit)
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = GenerateDates(_date, _count, input.type);

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
                    type: input.type,
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
                type: value.type,
                datas: dates.map((value1, index1, array1) => {
                    let datas: IResponse.IOccupancy.ISummaryR_Data[] = value.datas.filter((value2, index2, array2) => {
                        return value2.date.getTime() === value1.getTime();
                    });
                    return {
                        objectId: datas.length > 0 ? datas[0].objectId : '',
                        total: datas.length > 0 ? datas[0].total : 0,
                        analyst: input.analyst,
                        date: value1,
                    };
                }),
            };
        });

        if (outputs.length === 0) {
            outputs.push({
                camera: '',
                date: new Date(_date),
                type: input.type,
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
