import { ParseObject } from 'helpers/parse-server/parse-helper';
import { Tree } from 'models/nodes';
import * as Rx from 'rxjs';

export class ParseObjectNotice<T> extends ParseObject<T> {
    protected static _notice$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd'; data: Parse.Object }> = new Rx.Subject();

    destroy(options?: Parse.Object.DestroyOptions): Parse.Promise<this> {
        let promise = new Parse.Promise<this>();

        (async () => {
            try {
                await super.destroy(options);

                ParseObjectNotice._notice$.next({
                    crud: 'd',
                    data: this,
                });

                promise.resolve(this);
            } catch (e) {
                promise.reject(e);
            }
        })();

        return promise;
    }

    save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(key: string, value: any, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(attrs: object, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(arg1?, arg2?, arg3?): Parse.Promise<this> {
        let promise = new Parse.Promise<this>();

        (async () => {
            try {
                let crud: 'c' | 'r' | 'u' | 'd' = !!this.id ? 'u' : 'c';

                await super.save(...arguments);

                ParseObjectNotice._notice$.next({
                    crud: crud,
                    data: this,
                });

                promise.resolve(this);
            } catch (e) {
                promise.reject(e);
            }
        })();

        return promise;
    }
}

export abstract class TreeNotice<T> extends Tree<T> {
    abstract groupBy: keyof T | null;

    protected static _notice$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd'; data: Parse.Object }> = new Rx.Subject();

    destroy(options?: Parse.Object.DestroyOptions): Parse.Promise<this> {
        let promise = new Parse.Promise<this>();

        (async () => {
            try {
                await super.destroy(options);

                TreeNotice._notice$.next({
                    crud: 'd',
                    data: this,
                });

                promise.resolve(this);
            } catch (e) {
                promise.reject(e);
            }
        })();

        return promise;
    }

    save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(key: string, value: any, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(attrs: object, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(arg1?, arg2?, arg3?): Parse.Promise<this> {
        let promise = new Parse.Promise<this>();

        (async () => {
            try {
                await super.save(...arguments);

                TreeNotice._notice$.next({
                    crud: !!this.id ? 'u' : 'c',
                    data: this,
                });

                promise.resolve(this);
            } catch (e) {
                promise.reject(e);
            }
        })();

        return promise;
    }
}

export * from './acs-card';

export * from './client-frs';
export * from './client-hikvision';
export * from './client-vms';

export * from './location-buildings';
export * from './location-companies';
export * from './location-floors';

export * from './notify-person-blacklist';

export * from './person-staff-blacklist-orignial';
export * from './person-staff-blacklist';
export * from './person-staff-orignial';
export * from './person-staff';
export * from './person-visitor-blacklist-orignial';
export * from './person-visitor-blacklist';
export * from './person-visitor-orignial';
export * from './person-visitor';

export * from './setting-acs-group';
export * from './setting-acs-server';
export * from './setting-acs';
export * from './setting-email';
export * from './setting-frs';
export * from './setting-push-notification';
export * from './setting-suntec-app';
export * from './setting-system';
export * from './setting-text-message';

export * from './user-info';
