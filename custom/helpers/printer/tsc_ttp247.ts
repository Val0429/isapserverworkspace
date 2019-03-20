import { execFile } from 'child_process';
import { Config } from 'core/config.gen';
import { Printer } from './base';
import { File, DateTime } from '..';

export class Tsc_Ttp247 {
    /**
     * App
     */
    protected _app: string = File.RealPath(Config.printer.app);
    public get app(): string {
        return this._app;
    }

    /**
     * Printer Name
     */
    protected _device: string = Config.printer.device;
    public get device(): string {
        return this._device;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization device
     */
    public Initialization(): void {
        this._isInitialization = false;

        this._isInitialization = true;
    }

    /**
     * Print FET sticker
     * @param visitor
     * @param respondent
     * @param location
     * @param date
     * http://localhost:6061/printer/tsc_ttp247?visitorName=AAA&respondentName=BBB&date=CCC&locationName=DDD
     */
    public async PrintFetSticker(visitor: string, respondent: string, location: string, date?: string): Promise<string> {
        try {
            if (!this._isInitialization) {
                throw Printer.Message.DeviceNotInitialization;
            }

            if (!date) {
                date = DateTime.DateTime2String(new Date(), 'MM/DD');
            }

            let result: string = await new Promise<string>((resolve, reject) => {
                try {
                    execFile(this._app, [this._device, visitor, respondent, date, location], (error, stdout) => {
                        if (error) {
                            return reject(error);
                        }

                        resolve(stdout);
                    });
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });

            return result;
        } catch (e) {
            throw e;
        }
    }
}
