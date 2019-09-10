import { Observable, Subject } from 'rxjs';
import { Semaphore } from 'helpers/utility';

interface PromiseDone<T> extends Promise<T> {
    done: boolean;
    value: T;
}

export function semaphore<T>(max: number, callback: (input: T) => Promise<T>) {
    let lock = new Semaphore(max);
    let promises: PromiseDone<T>[] = [];

    return function(source): Observable<T> {
        return Observable.create( (subscriber) => {
            let emitValues = () => {
                while (promises.length > 0) {
                    let promise = promises[0];
                    if (!promise.done) return;

                    promises.shift();
                    subscriber.next(promise.value);
                }
            }

            let subscription = source.subscribe( async (value: T) => {
                await lock.toPromise();

                let promise: PromiseDone<T> = callback(value) as PromiseDone<T>;
                promises.push(promise);
                
                let result = await promise;
                promise.done = true;
                promise.value = result;
                emitValues();

                lock.release();

            }, err => subscriber.error(err), async () => {
                await lock.onCompleted();
                subscriber.complete();
            });
        
            return subscription;

        }).share();
    }
}
