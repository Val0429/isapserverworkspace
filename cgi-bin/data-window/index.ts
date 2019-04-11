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
enum PushMode {
    'region',
    'site',
    'stop',
}
export const push$: Rx.Subject<IPushCount> = new Rx.Subject();

action.ws(async (data) => {
    let _socket: Socket = data.socket;

    // let _count: number = PeopleCountingService.devices.length;

    let _mode: PushMode = PushMode.stop;
    let _id: string = '';

    let _counts: IPushCount[] = [];

    push$
        // .bufferCount(_count)
        // .map((x) => {
        //     let counts: IPushCount[] = [].concat(...x);
        //     let deviceIds: string[] = counts.map((value, index, array) => {
        //         return value.deviceId;
        //     });

        //     counts = counts.filter((value, index, array) => {
        //         return deviceIds.lastIndexOf(value.deviceId) === index;
        //     });

        //     return counts;
        // })
        // .filter((x) => {
        //     return x.length > 0;
        // })
        .subscribe({
            next: async (x) => {
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

                if (_mode !== PushMode.stop) {
                    let counts = CountFilter(_counts, _mode, _id);
                    if (counts.length > 0) {
                        _socket.send(counts);
                    }
                }
            },
        });

    _socket.io.on('message', async (data) => {
        let _input: IWs<any> = JSON.parse(data);

        if (_input.type === PushMode[PushMode.stop]) {
            _id = '';
            return;
        }

        if (_input.type === PushMode[PushMode.region]) {
            _mode = PushMode.region;
            _id = _input.content;
        } else if (_input.type === PushMode[PushMode.site]) {
            _mode = PushMode.site;
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
    });
});

/**
 * Filter
 * @param counts
 * @param mode
 * @param id
 */
function CountFilter(counts: IPushCount[], mode: PushMode, id: string): IPushCount[] {
    if (mode === PushMode.region) {
        let count: IPushCount = counts
            .filter((value, index, array) => {
                return value.regionId === id;
            })
            .reduce((prev, curr, index, array) => {
                return {
                    regionId: prev.regionId,
                    siteId: '',
                    deviceId: '',
                    count: {
                        in: prev.count.in + curr.count.in,
                        out: prev.count.out + curr.count.out,
                    },
                };
            });
        count.siteId = '';
        count.deviceId = '';

        return [count];
    } else if (mode === PushMode.site) {
        return counts.filter((value, index, array) => {
            return value.siteId === id;
        });
    }
}
