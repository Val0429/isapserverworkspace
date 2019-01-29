import { IUser, Action, Restful, RoleList, Errors, Parse, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IWs } from '../../custom/models';
import * as Rx from 'rxjs';
import * as Occupancy from '.';

export const pulling$: Rx.Subject<{}> = new Rx.Subject();

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IOccupancy.IChartR;

type OutputR = IResponse.IOccupancy.IChartR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await Occupancy.GetGroup(data.inputType);
    },
);

/**
 * Action WebSocket
 */
action.ws(async (data) => {
    let _socket: Socket = data.socket;
    let _analyst: any = '';

    let _isLive: boolean = true;
    let _frequency: any = 'none';

    pulling$.subscribe({
        next: async () => {
            if (_isLive) {
                _socket.send(
                    await Occupancy.GetGroup({
                        analyst: _analyst,
                        frequency: _frequency,
                    }),
                );
            }
        },
    });

    _socket.io.on('message', async (data) => {
        let _input: IWs<any> = JSON.parse(data);

        if (_input.type === 'mode') {
            let _content: boolean = _input.content;

            _isLive = _content;
        } else if (_input.type === 'search') {
            let _content: IRequest.IOccupancy.IChartR = _input.content;

            _analyst = _content.analyst;
            _frequency = _content.frequency;
            _socket.send(await Occupancy.GetGroup(_content));
        }
    });
});
