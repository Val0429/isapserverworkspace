import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Service {
    public ready$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    public acsServerSetting$: Rx.BehaviorSubject<IDB.ISettingACSServer> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public acsSetting$: Rx.BehaviorSubject<IDB.ISettingACS> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public emailSetting$: Rx.BehaviorSubject<IDB.ISettingEmail> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public frsSetting$: Rx.BehaviorSubject<IDB.ISettingFRS> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public pushNotificationSetting$: Rx.BehaviorSubject<IDB.ISettingPushNotification> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public suntecAppSetting$: Rx.BehaviorSubject<IDB.ISettingSuntecApp> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public systemSetting$: Rx.BehaviorSubject<IDB.ISettingSystem> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public textMessageSetting$: Rx.BehaviorSubject<IDB.ISettingTextMessage> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    constructor() {
        this.acsServerSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateACSServerSetting();
                },
            });

        this.acsSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateACSSetting();
                },
            });

        this.emailSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateEmailSetting();
                },
            });

        this.frsSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateFRSSetting();
                },
            });

        this.pushNotificationSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdatePushNotificationSetting();
                },
            });

        this.suntecAppSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateSuntecAppSetting();
                },
            });

        this.systemSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateSystemSetting();
                },
            });

        this.textMessageSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateTextMessageSetting();
                },
            });

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
            await this.Search();

            this.ready$.next();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let tasks = [];

            tasks.push(this.SearchACSServerSetting());
            tasks.push(this.SearchACSSetting());
            tasks.push(this.SearchEmailSetting());
            tasks.push(this.SearchFRSSetting());
            tasks.push(this.SearchPushNotificationSetting());
            tasks.push(this.SearchSuntecAppSetting());
            tasks.push(this.SearchSystemSetting());
            tasks.push(this.SearchTextMessageSetting());

            await Promise.all(tasks);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search ACS Server Setting
     */
    private async SearchACSServerSetting(): Promise<void> {
        try {
            let setting: IDB.SettingACSServer = await new Parse.Query(IDB.SettingACSServer).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.acsServerSetting$.next({
                    ip: '',
                    port: 0,
                    serviceId: '',
                });
            } else {
                this.acsServerSetting$.next({
                    ip: setting.getValue('ip'),
                    port: setting.getValue('port'),
                    serviceId: setting.getValue('serviceId'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search ACS Setting
     */
    private async SearchACSSetting(): Promise<void> {
        try {
            let setting: IDB.SettingACS = await new Parse.Query(IDB.SettingACS).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.acsSetting$.next({
                    staffCardRange: {
                        min: 2185450001,
                        max: 2185475000,
                    },
                    visitorCardRange: {
                        min: 2185475001,
                        max: 2185500000,
                    },
                    isUseACSServer: true,
                });
            } else {
                this.acsSetting$.next({
                    staffCardRange: setting.getValue('staffCardRange'),
                    visitorCardRange: setting.getValue('visitorCardRange'),
                    isUseACSServer: setting.getValue('isUseACSServer'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search Email Setting
     */
    private async SearchEmailSetting(): Promise<void> {
        try {
            let setting: IDB.SettingEmail = await new Parse.Query(IDB.SettingEmail).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.emailSetting$.next({
                    enable: false,
                    host: '',
                    port: 0,
                    email: '',
                    password: '',
                });
            } else {
                this.emailSetting$.next({
                    enable: setting.getValue('enable'),
                    host: setting.getValue('host'),
                    port: setting.getValue('port'),
                    email: setting.getValue('email'),
                    password: setting.getValue('password'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search FRS Setting
     */
    private async SearchFRSSetting(): Promise<void> {
        try {
            let setting: IDB.SettingFRS = await new Parse.Query(IDB.SettingFRS).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.frsSetting$.next({
                    protocol: 'http',
                    ip: '127.0.0.1',
                    port: 80,
                    account: 'Admin',
                    password: '123456',
                });
            } else {
                this.frsSetting$.next({
                    protocol: setting.getValue('protocol'),
                    ip: setting.getValue('ip'),
                    port: setting.getValue('port'),
                    account: setting.getValue('account'),
                    password: setting.getValue('password'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search Push Notification Setting
     */
    private async SearchPushNotificationSetting(): Promise<void> {
        try {
            let setting: IDB.SettingPushNotification = await new Parse.Query(IDB.SettingPushNotification).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.pushNotificationSetting$.next({
                    enable: false,
                    fcm: {
                        serverKey: '',
                        collapseKey: '',
                    },
                    apn: {
                        key: '',
                        keyId: '',
                        teamId: '',
                        topic: '',
                    },
                });
            } else {
                this.pushNotificationSetting$.next({
                    enable: setting.getValue('enable'),
                    fcm: setting.getValue('fcm'),
                    apn: setting.getValue('apn'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search Suntec App Setting
     */
    private async SearchSuntecAppSetting(): Promise<void> {
        try {
            let setting: IDB.SettingSuntecApp = await new Parse.Query(IDB.SettingSuntecApp).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.suntecAppSetting$.next({
                    host: 'staging.sunteccity.com.sg',
                    token: 'C4556D83B7F96CF7E276F330F4F1FA05',
                });
            } else {
                this.suntecAppSetting$.next({
                    host: setting.getValue('host'),
                    token: setting.getValue('token'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search System Setting
     */
    private async SearchSystemSetting(): Promise<void> {
        try {
            let setting: IDB.SettingSystem = await new Parse.Query(IDB.SettingSystem).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.systemSetting$.next({
                    hosting: '',
                });
            } else {
                this.systemSetting$.next({
                    hosting: setting.getValue('hosting'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search Text Message Setting
     */
    private async SearchTextMessageSetting(): Promise<void> {
        try {
            let setting: IDB.SettingTextMessage = await new Parse.Query(IDB.SettingTextMessage).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                this.textMessageSetting$.next({
                    enable: false,
                    sgsms: {
                        url: '',
                        account: '',
                        password: '',
                    },
                });
            } else {
                this.textMessageSetting$.next({
                    enable: setting.getValue('enable'),
                    sgsms: setting.getValue('sgsms'),
                });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update ACS Server Setting
     */
    private async UpdateACSServerSetting(): Promise<void> {
        try {
            let value = this.acsServerSetting$.value;

            let setting: IDB.SettingACSServer = await new Parse.Query(IDB.SettingACSServer).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingACSServer();
            }

            setting.setValue('ip', value.ip);
            setting.setValue('port', value.port);
            setting.setValue('serviceId', value.serviceId);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update ACS Setting
     */
    private async UpdateACSSetting(): Promise<void> {
        try {
            let value = this.acsSetting$.value;

            let setting: IDB.SettingACS = await new Parse.Query(IDB.SettingACS).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingACS();
            }

            setting.setValue('staffCardRange', value.staffCardRange);
            setting.setValue('visitorCardRange', value.visitorCardRange);
            setting.setValue('isUseACSServer', value.isUseACSServer);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update Email Setting
     */
    private async UpdateEmailSetting(): Promise<void> {
        try {
            let value = this.emailSetting$.value;

            let setting: IDB.SettingEmail = await new Parse.Query(IDB.SettingEmail).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingEmail();
            }

            setting.setValue('enable', value.enable);
            setting.setValue('host', value.host);
            setting.setValue('port', value.port);
            setting.setValue('email', value.email);
            setting.setValue('password', value.password);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update FRS Setting
     */
    private async UpdateFRSSetting(): Promise<void> {
        try {
            let value = this.frsSetting$.value;

            let setting: IDB.SettingFRS = await new Parse.Query(IDB.SettingFRS).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingFRS();
            }

            setting.setValue('protocol', value.protocol);
            setting.setValue('ip', value.ip);
            setting.setValue('port', value.port);
            setting.setValue('account', value.account);
            setting.setValue('password', value.password);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update Push Notification Setting
     */
    private async UpdatePushNotificationSetting(): Promise<void> {
        try {
            let value = this.pushNotificationSetting$.value;

            let setting: IDB.SettingPushNotification = await new Parse.Query(IDB.SettingPushNotification).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingPushNotification();
            }

            setting.setValue('enable', value.enable);
            setting.setValue('fcm', value.fcm);
            setting.setValue('apn', value.apn);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update Suntec App Setting
     */
    private async UpdateSuntecAppSetting(): Promise<void> {
        try {
            let value = this.suntecAppSetting$.value;

            let setting: IDB.SettingSuntecApp = await new Parse.Query(IDB.SettingSuntecApp).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingSuntecApp();
            }

            setting.setValue('host', value.host);
            setting.setValue('token', value.token);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update System Setting
     */
    private async UpdateSystemSetting(): Promise<void> {
        try {
            let value = this.systemSetting$.value;

            let setting: IDB.SettingSystem = await new Parse.Query(IDB.SettingSystem).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingSystem();
            }

            setting.setValue('hosting', value.hosting);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update Text Message Setting
     */
    private async UpdateTextMessageSetting(): Promise<void> {
        try {
            let value = this.textMessageSetting$.value;

            let setting: IDB.SettingTextMessage = await new Parse.Query(IDB.SettingTextMessage).first().fail((e) => {
                throw e;
            });
            if (!setting) {
                setting = new IDB.SettingTextMessage();
            }

            setting.setValue('enable', value.enable);
            setting.setValue('sgsms', value.sgsms);

            await setting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}
