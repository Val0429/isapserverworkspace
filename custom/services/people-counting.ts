import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, CMSService, HumanDetection, File, Draw } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as DataWindow from '../../cgi-bin/data-window';

class Service {
    private _devices: IDB.LocationDevice[] = undefined;
    public get devices(): IDB.LocationDevice[] {
        return this._devices;
    }

    constructor() {
        IDB.Camera$.subscribe({
            next: async (x) => {
                try {
                    if (x.mode !== Enum.ECameraMode.peopleCounting || x.type !== Enum.ECameraType.eocortex) {
                        return;
                    }

                    if (x.crud === 'u') {
                        await this.Initialization();
                    }
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        IDB.LocationFloor$.subscribe({
            next: async (x) => {
                try {
                    if (x.crud === 'd') {
                        await this.Initialization();
                    }
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        IDB.LocationArea$.subscribe({
            next: async (x) => {
                try {
                    if (x.mode !== Enum.ECameraMode.peopleCounting) {
                        return;
                    }

                    if (x.crud === 'u' || x.crud === 'd') {
                        await this.Initialization();
                    }
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        IDB.LocationDevice$.subscribe({
            next: async (x) => {
                try {
                    if (x.mode !== Enum.ECameraMode.peopleCounting) {
                        return;
                    }

                    if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
                        await this.Initialization();
                    }
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        setTimeout(async () => {
            await this.Initialization();
        }, 150);
    }

    private Initialization = async (): Promise<void> => {
        try {
            this.StopLiveStream();

            await this.Search();

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };

    private StopLiveStream = (): void => {
        try {
        } catch (e) {
            throw e;
        }
    };

    private Search = async (): Promise<void> => {
        try {
            this._devices = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .equalTo('mode', Enum.ECameraMode.peopleCounting)
                .include(['floor', 'area', 'camera'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._devices = this.devices.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted') && !value.getValue('area').getValue('isDeleted') && value.getValue('camera').getValue('type') === Enum.ECameraType.eocortex;
            });

            this._devices.forEach((value, index, array) => {
                Print.Log(`People Counting: (${value.getValue('floor').id}->${value.getValue('area').id}->${value.id}->${value.getValue('camera').id}), ${value.getValue('name')}`, new Error(), 'info');
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStream = (): void => {
        try {
        } catch (e) {
            throw e;
        }
    };
}
export default new Service();

namespace Service {}
