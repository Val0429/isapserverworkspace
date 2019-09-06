import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    public emailSetting$: Rx.BehaviorSubject<IDB.ISettingEmail> = new Rx.BehaviorSubject(undefined);

    /**
     *
     */
    public pushNotificationSetting$: Rx.BehaviorSubject<IDB.ISettingPushNotification> = new Rx.BehaviorSubject(undefined);

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
        this.emailSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdateEmailSetting();
                },
            });

        this.pushNotificationSetting$
            .filter((x) => !!x)
            .subscribe({
                next: async (x) => {
                    await this.UpdatePushNotificationSetting();
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
        } catch (e) {
            console.log(e);
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let tasks = [];

            tasks.push(this.SearchEmailSetting());
            tasks.push(this.SearchPushNotificationSetting());
            tasks.push(this.SearchSystemSetting());
            tasks.push(this.SearchTextMessageSetting());

            await Promise.all(tasks);
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
