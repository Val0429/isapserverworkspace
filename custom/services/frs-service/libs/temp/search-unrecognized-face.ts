import { Observable, Subject } from 'rxjs';
import { UserType, RecognizedUser, UnRecognizedUser, IFRSConfig } from './core';
import { Semaphore } from 'helpers/utility/semaphore';

export function searchUnRecognizedFace(face: UnRecognizedUser, config: IFRSConfig) {
    let cache: (RecognizedUser | UnRecognizedUser)[] = [];
    let match: UnRecognizedUser = null;
    let matchStart: number;
    let matchEnd: number;
    let possibleCompanionMilliSeconds: number = config.possibleCompanionDurationSeconds * 1000;

    return function(source): Observable<RecognizedUser | UnRecognizedUser> {
        return Observable.create( (subscriber) => {
            let resolveNotMatchData = (data: RecognizedUser | UnRecognizedUser) => {
                let timestamp = data.timestamp;
                if (timestamp >= matchStart && timestamp <= matchEnd) {
                    subscriber.next(data);
                    return;
                }
                cache.push(data);
            }

            let flushCache = () => {
                while (cache.length > 0) {
                    let cacheData = cache.shift();
                    if (cacheData.timestamp < matchStart) continue;
                    subscriber.next(cacheData);
                }
            }

            let subscription = source.subscribe( async (value: RecognizedUser | UnRecognizedUser) => {

                /// 1) find unrecognized user score for same person
                if (value.type === UserType.UnRecognized && value.score >= config.specialScoreForUnRecognizedFace) {
                    value.search_ok = true;
                    match = value;
                    matchStart = value.timestamp - possibleCompanionMilliSeconds;
                    matchEnd = value.timestamp + possibleCompanionMilliSeconds;
                    flushCache();
                    subscriber.next(value);
                    return;
                }

                /// 2) cache or resolve
                value.search_ok = false;
                resolveNotMatchData(value);

            }, err => subscriber.error(err), async () => {
                subscriber.complete();
            });
        
            return subscription;

        }).share();
    }
}
