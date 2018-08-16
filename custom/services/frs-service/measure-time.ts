import { Observable, Subject } from 'rxjs';
import { UserType, RecognizedUser, UnRecognizedUser } from './core';
import { Config } from './../../../../core/config.gen';
import { Semaphore } from 'helpers/utility/semaphore';

export function measureTime<T>( real: (source) => Observable<T> ) {

    return function(source): Observable<T> {

        return Observable.create( (subscriber) => {
            let time = 0;
            let sj = new Subject<T>();
            let innerOb = real(sj);
            innerOb.subscribe((value) => {
                subscriber.next(value);
            }, err => subscriber.error(err), () => subscriber.complete());

            let subscription = source.subscribe( async (value: T) => {
                sj.next(value);

            }, err => subscriber.error(err), async () => {
                sj.complete();
            });
        
            return subscription;

        }).share();
    }
}
