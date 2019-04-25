import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB, IWs } from '../../custom/models';
import { Print, DateTime } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Rx from 'rxjs';
import * as Occupancy from '../occupancy';

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
                                type: 'searchSummary',
                                content: await GetSummary({
                                    analyst: _analyst,
                                    type: _type,
                                    count: _count,
                                }),
                            } as IWs<IResponse.IFaceCount.ISummaryR[]>);
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
                } else if (_input.type === 'searchSummary') {
                    let _content: IRequest.IFaceCount.ISummaryR = _input.content;

                    _analyst = _content.analyst;
                    _count = _content.count;
                    _type = _content.type;

                    _socket.send({
                        type: _input.type,
                        content: await GetSummary(_content),
                    } as IWs<IResponse.IFaceCount.ISummaryR[]>);
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
 * Get summary data
 * @param input
 */
export async function GetSummary(input: IRequest.IFaceCount.ISummaryR): Promise<IResponse.IFaceCount.ISummaryR[]> {
    try {
        let _count: number = input.count || 10;
        let _date: Date = new Date(input.date || new Date());

        let cameraCount: number = await Occupancy.GetCameraCount(IDB.HumanSummary);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(_date);

        if (input.type === 'month') {
            min = new Date(min.setMonth(min.getMonth() - _count));
        } else if (input.type === 'day') {
            min = new Date(min.setDate(min.getDate() - _count));
        } else if (input.type === 'hour') {
            min = new Date(min.setHours(min.getHours() - _count));
        }

        let humanSummarys: IDB.HumanSummary[] = await new Parse.Query(IDB.HumanSummary)
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

        let dates: Date[] = await Occupancy.GenerateDates(_date, _count, input.type);

        let summarys: IResponse.IFaceCount.ISummaryR[] = humanSummarys.reduce<IResponse.IFaceCount.ISummaryR[]>((previousValue, currentValue, currentIndex, array) => {
            let cameras: string[] = previousValue.map((value, index, array) => {
                return value.camera;
            });

            let data: IResponse.IFaceCount.ISummaryR_Data = {
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

        let outputs: IResponse.IFaceCount.ISummaryR[] = summarys.map((value, index, array) => {
            return {
                camera: value.camera,
                date: value.date,
                type: value.type,
                datas: dates.map((value1, index1, array1) => {
                    let datas: IResponse.IFaceCount.ISummaryR_Data[] = value.datas.filter((value2, index2, array2) => {
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
