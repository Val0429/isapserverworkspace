import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, DateTime, File } from '../helpers';
import * as Enum from '../enums';

class Action {
    private _logPath: string = './workspace/custom/assets/logs';
    public get logPath(): string {
        return this._logPath;
    }

    private _logFile: string = 'log-{{date}}.log';
    public get logFile(): string {
        return this._logFile;
    }

    private _bufferTimeSecond: number = 1000;
    public get bufferTimeSecond(): number {
        return this._bufferTimeSecond;
    }

    private _action$: Rx.Subject<string> = new Rx.Subject();
    public get action$(): Rx.Subject<string> {
        return this._action$;
    }

    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            this._action$.bufferTime(this._bufferTimeSecond).subscribe({
                next: async (x) => {
                    try {
                        if (!x || x.length <= 0) {
                            return;
                        }

                        let now: Date = new Date();
                        let date: string = DateTime.DateTime2String(now, 'YYYY-MM-DD');

                        let log: string = x.reduce((prev, curr, index, array) => {
                            return `${prev}\r\n${curr}`;
                        }, '');

                        File.AppendFile(`${this._logPath}/${this._logFile.replace(/{{date}}/g, date)}`, log);
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };
}
export default new Action();
