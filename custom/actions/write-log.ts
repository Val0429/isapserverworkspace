import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, DateTime, File } from '../helpers';
import * as Enum from '../enums';

class Action {
    /**
     *
     */
    private _logPath: string = './workspace/custom/assets/logs';
    public get logPath(): string {
        return this._logPath;
    }

    /**
     *
     */
    private _logFile: string = 'log-{{date}}-{{index}}.log';
    public get logFile(): string {
        return this._logFile;
    }

    /**
     *
     */
    private _limitSize: number = 10000000;

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
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    /**
     * Initialization
     */
    private Initialization(): void {
        try {
            this._action$.buffer(Rx.Observable.interval(1000)).subscribe({
                next: async (x) => {
                    try {
                        this.WriteLogs(x);
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Write logs
     * @param messages
     */
    public WriteLogs(messages: string[]): void {
        try {
            if (!messages || messages.length === 0) {
                return;
            }

            let now: Date = new Date();
            let date: string = DateTime.ToString(now, 'YYYY-MM-DD');

            let log: string = messages.reduce((prev, curr, index, array) => {
                return `${prev}${curr}\r\n`;
            }, '');

            let filename: string = `${this._logPath}/${this._logFile.replace(/{{date}}/g, date)}`;
            for (let i: number = 1; true; i++) {
                let _filename: string = filename.replace(/{{index}}/g, i.toString());
                if (File.GetFileAlive(_filename) && File.GetFileStatus(_filename).size >= this._limitSize) {
                    continue;
                }

                filename = _filename;
                break;
            }

            File.AppendFile(filename, log);
        } catch (e) {
            throw e;
        }
    }
}
export default new Action();
