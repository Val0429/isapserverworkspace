import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { HumanSummary, IRequest, IResponse, IWs } from '../../custom/models';
import { Print, DateTime } from 'workspace/custom/helpers';
import * as Occupancy from '../occupancy';
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
                        type: 'searchSummary',
                        content: await GetSummary({
                            analyst: _analyst,
                            type: _type,
                            count: _count,
                        }),
                    } as IWs<IResponse.IDemographic.ISummaryR[]>);
                }
            }
        },
    });

    _socket.io.on('message', async (data) => {
        let _input: IWs<any> = JSON.parse(data);

        if (_input.type === 'changeMode') {
            let _content: boolean = _input.content;

            _isLive = _content;
        } else if (_input.type === 'searchSummary') {
            let _content: IRequest.IDemographic.ISummaryR = _input.content;

            _analyst = _content.analyst;
            _count = _content.count;
            _type = _content.type;

            _socket.send({
                type: _input.type,
                content: await GetSummary(_content),
            } as IWs<IResponse.IDemographic.ISummaryR[]>);
        }
    });
});

/**
 * Get summary data
 * @param input
 */
export async function GetSummary(input: IRequest.IDemographic.ISummaryR): Promise<IResponse.IDemographic.ISummaryR[]> {
    try {
        let _count: number = input.count || 10;
        let _date: Date = new Date(input.date || new Date());

        let cameraCount: number = await Occupancy.GetCameraCount(HumanSummary);

        let limit: number = _count * (cameraCount + 1);
        let min: Date = new Date(_date);

        if (input.type === 'month') {
            min = new Date(min.setMonth(min.getMonth() - _count));
        } else if (input.type === 'day') {
            min = new Date(min.setDate(min.getDate() - _count));
        } else if (input.type === 'hour') {
            min = new Date(min.setHours(min.getHours() - _count));
        }

        let humanSummarys: HumanSummary[] = await new Parse.Query(HumanSummary)
            .equalTo('analyst', input.analyst)
            .equalTo('type', input.type)
            .lessThanOrEqualTo('date', _date)
            .greaterThan('date', min)
            .descending('date')
            .limit(limit)
            .include('humans')
            .find()
            .catch((e) => {
                throw e;
            });

        let dates: Date[] = await Occupancy.GenerateDates(_date, _count, input.type);

        let ageRange: string = Config.demographic.ageRange;
        let ageRanges: string[] = ageRange.split('-').reduce((prev, curr, index, array) => {
            if (index !== 0) {
                curr = (parseInt(curr) + parseInt(prev[index - 1])).toString();
                prev[index - 1] = `${prev[index - 1]}-${curr}`;
            }

            prev.push(curr);

            return prev;
        }, []);
        ageRanges[ageRanges.length - 1] = `${ageRanges[ageRanges.length - 1]}以上`;

        let summarys: IResponse.IDemographic.ISummaryR[] = humanSummarys.reduce<IResponse.IDemographic.ISummaryR[]>((previousValue, currentValue, currentIndex, array) => {
            let humans: IResponse.IDemographic.IHuman[] = currentValue.getValue('humans').map((value, index, array) => {
                return {
                    name: value.getValue('name'),
                    src: `${Config.demographic.output.path}/${value.getValue('src')}`,
                    gender: value.getValue('gender'),
                    age: value.getValue('age'),
                    date: value.getValue('date'),
                };
            });

            let humanss: { range: string; humans: IResponse.IDemographic.IHuman[] }[] = humans.reduce((previousValue, currentValue, currentIndex, array) => {
                let range: string =
                    ageRanges.find((value, index, array) => {
                        let ranges = value.split('-').map(Number);
                        return ranges[0] < currentValue.age && currentValue.age <= ranges[1];
                    }) || ageRanges[ageRanges.length - 1];

                let ranges: string[] = previousValue.map((value, index, array) => {
                    return value.range;
                });

                let key: number = ranges.indexOf(range);
                if (key < 0) {
                    previousValue.push({
                        range: range,
                        humans: [currentValue],
                    });
                } else {
                    previousValue[key].humans.push(currentValue);
                }

                return previousValue;
            }, []);

            humanss.sort((a, b) => {
                return a.range > b.range ? 1 : -1;
            });

            let types: string[] = [].concat(
                previousValue.map((value, index, array) => {
                    return ageRanges.map((value1, index1, array1) => {
                        return `${value.camera}-${value1}`;
                    });
                }),
            );

            humanss.forEach((value, index, array) => {
                let key: number = types.indexOf(`${currentValue.getValue('camera')}-${value.range}`);

                let data: IResponse.IDemographic.ISummaryR_Data = {
                    objectId: currentValue.id,
                    analyst: currentValue.getValue('analyst'),
                    date: currentValue.getValue('date'),
                    total: value.humans.length,
                    male: value.humans.filter((value1, index1, array1) => {
                        return value1.gender === 'male';
                    }).length,
                    humans: value.humans,
                };

                if (key < 0) {
                    previousValue.push({
                        camera: currentValue.getValue('camera'),
                        range: value.range,
                        date: new Date(_date),
                        type: input.type,
                        datas: [data],
                    });
                } else {
                    previousValue[key].datas.push(data);
                }
            });

            return previousValue;
        }, []);

        let outputs: IResponse.IDemographic.ISummaryR[] = summarys.map((value, index, array) => {
            return {
                camera: value.camera,
                range: value.range,
                date: value.date,
                type: value.type,
                datas: dates.map((value1, index1, array1) => {
                    let datas: IResponse.IDemographic.ISummaryR_Data[] = value.datas.filter((value2, index2, array2) => {
                        return value2.date.getTime() === value1.getTime();
                    });
                    return {
                        objectId: datas.length > 0 ? datas[0].objectId : '',
                        total: datas.length > 0 ? datas[0].total : 0,
                        analyst: input.analyst,
                        date: value1,
                        male: datas.length > 0 ? datas[0].male : 0,
                        humans: datas.length > 0 ? datas[0].humans : [],
                    };
                }),
            };
        });

        if (outputs.length === 0) {
            outputs.push({
                camera: '',
                range: '',
                date: new Date(_date),
                type: input.type,
                datas: dates.map((value, index, array) => {
                    return {
                        objectId: '',
                        total: 0,
                        analyst: input.analyst,
                        date: value,
                        male: 0,
                        humans: [],
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
