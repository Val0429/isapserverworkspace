import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    /**
     *
     */
    private _action$: Rx.Subject<string> = new Rx.Subject();
    public get action$(): Rx.Subject<string> {
        return this._action$;
    }

    /**
     *
     */
    constructor() {
        Main.ready$.subscribe({
            next: async () => {
                await this.Initialization();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this._action$.subscribe({
                next: async (x) => {
                    try {
                        File.DeleteFile(x);
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }
}
export default new Action();
