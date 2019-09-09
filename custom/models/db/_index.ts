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
                await super.save(...arguments);

                ParseObjectNotice._notice$.next({
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

export * from './location-buildings';
export * from './setting-email';
export * from './setting-push-notification';
export * from './setting-system';
export * from './setting-text-message';

export * from './user-info';
