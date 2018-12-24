import { Observable, Subject } from 'rxjs';
import { UserType, RecognizedUser, UnRecognizedUser } from './core';
import { Config } from './../../../../core/config.gen';
import { Semaphore } from 'helpers/utility/semaphore';
import frs from './../frs-service';
import * as fs from 'fs';

export function saveSnapshot(asyncCount: number) {
    let lock: Semaphore = new Semaphore(asyncCount);

    return function(source): Observable<RecognizedUser | UnRecognizedUser> {

        return Observable.create( (subscriber) => {

            let subscription = source.subscribe( async (value: RecognizedUser | UnRecognizedUser) => {
                await lock.toPromise();
                {
                    try {
                        let path = `${__dirname}/../../files/snapshots/${value.snapshot}`;
                        let exists = await new Promise((resolve, reject) => { fs.exists(path, (ex) => resolve(ex)); });
                        if (exists === false) {
                            let result = await frs.snapshot(value.snapshot);
                            fs.writeFile(path, result, () => {});
                        }
                        
                    } catch(e) {
                        console.log(`load snapshot <${value.snapshot}> error: `, e);
                    }

                }
                lock.release();
                subscriber.next(value);

            }, err => subscriber.error(err), async () => {
                await lock.onCompleted();
                subscriber.complete();
            });
        
            return subscription;

        }).share();
    }
}
