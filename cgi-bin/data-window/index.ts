import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IWs, IDB } from '../../custom/models';
import { Print, PeopleCounting } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Rx from 'rxjs';
import PeopleCountingService from '../../custom/services/people-counting';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action WebSocket
 */
interface IPushCount {
    regionId: string;
    siteId: string;
    deviceId: string;
    count: PeopleCounting.Hanwha.ICount;
}
enum EPushMode {
    'region',
    'site',
    'stop',
}
export const push$: Rx.Subject<IPushCount> = new Rx.Subject();

action.ws(async (data) => {
    let _socket: Socket = data.socket;

    let _mode: EPushMode = EPushMode.stop;
    let _id: string = '';

    let _counts: IPushCount[] = [];

    push$.subscribe({
        next: async (x) => {
            try {
                if (!_counts.find((n) => n.deviceId === x.deviceId)) {
                    _counts.push({
                        regionId: x.regionId,
                        siteId: x.siteId,
                        deviceId: x.deviceId,
                        count: x.count,
                    });
                } else {
                    _counts.find((n) => n.deviceId === x.deviceId).count = x.count;
                }

                if (_mode !== EPushMode.stop) {
                    let counts = CountFilter(_counts, _mode, _id);
                    if (counts.length > 0) {
                        _socket.send(counts);
                    }
                }
            } catch (e) {
                Print.Log(new Error(e), 'error');
            }
        },
    });

    _socket.io.on('message', async (data) => {
        try {
            let _input: IWs<any> = JSON.parse(data);

            if (_input.type === EPushMode[EPushMode.stop]) {
                _id = '';
                return;
            }

            if (_input.type === EPushMode[EPushMode.region]) {
                _mode = EPushMode.region;
                _id = _input.content;
            } else if (_input.type === EPushMode[EPushMode.site]) {
                _mode = EPushMode.site;
                _id = _input.content;
            }

            let counts: IPushCount[] = [].concat(
                ...(await Promise.all(
                    PeopleCountingService.devices.map(async (value, index, array) => {
                        let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
                        hanwha.config = value.getValue('camera').getValue('config');

                        hanwha.Initialization();

                        let counts = await hanwha.GetDoStatus();
                        let count = counts.length > 0 ? counts[0] : { in: 0, out: 0 };

                        return {
                            regionId: value.getValue('site').getValue('region').id,
                            siteId: value.getValue('site').id,
                            deviceId: value.id,
                            count: count,
                        };
                    }),
                ).catch((e) => {
                    throw e;
                })),
            );

            _counts = counts;

            counts = CountFilter(counts, _mode, _id);
            if (counts.length > 0) {
                _socket.send(counts);
            }
        } catch (e) {
            Print.Log(new Error(e), 'error');
        }
    });
});

/**
 * Filter
 * @param counts
 * @param mode
 * @param id
 */
function CountFilter(counts: IPushCount[], mode: EPushMode, id: string): IPushCount[] {
    try {
        if (mode === EPushMode.region) {
            let count: IPushCount = counts
                .filter((value, index, array) => {
                    return value.regionId === id;
                })
                .reduce(
                    (prev, curr, index, array) => {
                        return {
                            regionId: prev.regionId,
                            siteId: '',
                            deviceId: '',
                            count: {
                                in: prev.count.in + curr.count.in,
                                out: prev.count.out + curr.count.out,
                            },
                        };
                    },
                    {
                        regionId: id,
                        siteId: '',
                        deviceId: '',
                        count: {
                            in: 0,
                            out: 0,
                        },
                    },
                );

            return [count];
        } else if (mode === EPushMode.site) {
            return counts.filter((value, index, array) => {
                return value.siteId === id;
            });
        }
    } catch (e) {
        throw e;
    }
}
