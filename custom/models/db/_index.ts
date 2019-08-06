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

export * from './camera-cms';
export * from './camera-frs';
export * from './camera-hanwha';

export * from './device-group';
export * from './device';

export * from './event-campaign';

export * from './location-area';
export * from './location-region';
export * from './location-site';

export * from './office-hour';

export * from './report-base';
export * from './report-demographic-summary';
export * from './report-demographic';
export * from './report-heatmap-summary';
export * from './report-heatmap';
export * from './report-human-detection-summary';
export * from './report-human-detection';
export * from './report-people-counting-summary';
export * from './report-repeat-visitor';
export * from './report-sales-record';
export * from './report-template';

export * from './rule-base';
export * from './rule-human-detection';
export * from './rule-people-counting';
export * from './rule-repeat-visitor';
export * from './rule-visitor';

export * from './server-cms';
export * from './server-demographic';
export * from './server-frs-group';
export * from './server-frs-manager';
export * from './server-frs';
export * from './server-human-detection';

export * from './setting-email';
export * from './setting-push-notification';
export * from './setting-system';
export * from './setting-text-message';
export * from './setting-weather';

export * from './tag';

export * from './threshold';

export * from './user-group';
export * from './user-info';

export * from './weather';
