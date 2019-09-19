import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB, IBase } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as Main from '../../main';
import ActionEmail from '../actions/email';

class Service {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _notifys: IDB.NotifyPersonBlacklist[] = [];

    /**
     *
     */
    private _tos = [];

    /**
     *
     */
    constructor() {
        let next$: Rx.Subject<{}> = new Rx.Subject();
        this._initialization$
            .debounceTime(1000)
            .zip(next$.startWith(0))
            .subscribe({
                next: async () => {
                    try {
                        await this.Initialization();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }

                    next$.next();
                },
            });

        IDB.NotifyPersonBlacklist.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
                    this._initialization$.next();
                }
            },
        });

        Main.ready$.subscribe({
            next: async () => {
                this._initialization$.next();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            await this.Search();

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            this._notifys = await new Parse.Query(IDB.NotifyPersonBlacklist).find().fail((e) => {
                throw e;
            });

            this._tos = this._notifys.map((value, index, array) => {
                return {
                    name: value.getValue('name'),
                    email: value.getValue('email'),
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            IDB.PersonStaffBlacklist.notice$.subscribe({
                next: async (x) => {
                    try {
                        if (x.crud === 'c' || x.crud === 'd') {
                            let person: IDB.PersonStaffBlacklist = x.data as IDB.PersonStaffBlacklist;

                            let userInfo: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                                .equalTo('user', person.getValue('creator'))
                                .include('company')
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!userInfo) {
                                throw 'user not found';
                            }

                            let company: IDB.LocationCompanies = userInfo.getValue('company');

                            let title: string = `${!!company ? `${company.getValue('name')} - ` : ''}${userInfo.getValue('name')} ${x.crud === 'c' ? 'add' : 'remove'} one new blacklist person`;

                            let message: string = `
                                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                                    <h4>${title}</h4>
                                    <img src="cid:person" />
                                    <h4>${person.getValue('nric')}</h4>
                                </div>`;

                            ActionEmail.action$.next({
                                title: title,
                                message: message,
                                tos: this._tos,
                                attachments: [
                                    {
                                        filename: 'person.png',
                                        content: person.getValue('imageBase64'),
                                        encoding: 'base64',
                                        cid: 'person',
                                    },
                                ],
                            });
                        }
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}
