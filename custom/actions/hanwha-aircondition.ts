import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, PeopleCounting } from '../helpers';
import * as Enum from '../enums';

class Action {
    private _action$: Rx.Subject<Action.IActionData> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IActionData> {
        return this._action$;
    }

    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            this._action$.subscribe({
                next: async (x) => {
                    if (!x.group.getValue('action').hanwhaAirConditions) {
                        return;
                    }

                    let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
                    hanwha.config = x.group.getValue('nvrConfig');

                    hanwha.Initialization();

                    let prevRange = x.group.getValue('action').hanwhaAirConditions.find((value, index, array) => {
                        return value.triggerMax >= x.prev && value.triggerMin <= x.prev;
                    });
                    let currRange = x.group.getValue('action').hanwhaAirConditions.find((value, index, array) => {
                        return value.triggerMax >= x.curr && value.triggerMin <= x.curr;
                    });

                    if (JSON.stringify(currRange) !== JSON.stringify(prevRange)) {
                        if (currRange) await hanwha.ControlDo(currRange.doNumber, currRange.doStatus);
                        if (prevRange) await hanwha.ControlDo(prevRange.doNumber, prevRange.doStatus === 'Off' ? 'On' : 'Off');
                        Print.MinLog(`${x.group.id}, ${x.prev}(${JSON.stringify(prevRange)}) -> ${x.curr}(${JSON.stringify(currRange)})`);
                    }
                },
            });
        } catch (e) {
            Print.MinLog(e, 'error');
        }
    };
}
export default new Action();

namespace Action {
    export interface IActionData {
        group: IDB.CameraGroup;
        prev: number;
        curr: number;
    }
}
