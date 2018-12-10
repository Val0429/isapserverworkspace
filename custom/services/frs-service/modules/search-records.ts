import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason, UserType } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';

type Base64String = string;
declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        searchRecords(starttime: Date, endtime: Date, pageSize?: number, times?: number): Subject<RecognizedUser | UnRecognizedUser>;
    }
}

FRSService.prototype.searchRecords = function(starttime: Date, endtime: Date, pageSize: number = 20, times: number = 10): Subject<RecognizedUser | UnRecognizedUser> {
    var sj = new Subject<RecognizedUser | UnRecognizedUser>();

    const url: string = this.makeUrl('getverifyresultlist');
    const urlnon: string = this.makeUrl('getnonverifyresultlist');

    /// get raw data from FRS, merge all pages
    let poll = (starttime: number, endtime: number, url: string, page: number = 0): Observable<RecognizedUser[] | UnRecognizedUser[]> => {

        let doRequest = async (observer: Observer<any>, page: number = 0) => {
            return new Promise<void>( async (resolve, reject) => {

            /// wait for login, to startup request
            await this.waitForLogin();

            let bodyparam = { session_id: this.sessionId, start_time: starttime, end_time: endtime, page_size : pageSize, skip_pages: page };
            request({
                url,
                method: 'POST',
                json: true,
                body: bodyparam
            }, (err, res, body) => {
                /// request failed, do again
                if (err || res.statusCode !== 200) {
                    if (res.statusCode === 401) {
                        this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    }
                    return reject(err || body);
                }

                var result = (body.result || body.group_list || {});
                var results = result.verify_results;
                if (!results || results.length === 0) {
                    observer.complete();
                    return;
                }
                observer.next(results);

                // setTimeout( () => {

                    retry<void>( async (resolve, reject) => {
                        return doRequest(observer, result.page_index+1)
                            .then(resolve)
                            .catch(reject)
                    }, times);

                // }, 50);

                resolve();
            });

            });

        }
    
        return Observable.create( (observer) => {
            retry<void>( async (resolve, reject) => {
                return doRequest(observer)
                    .then(resolve)
                    .catch(reject);
            }, times);
        }).share();
    }

    /// indexes
    var recog = { timestamp: 0, finished: false, data: [] };
    var unrecog = { timestamp: 0, finished: false, data: [] };
    var queue = [];
    
    /// finalize search result
    let queueHandler = async () => {
        while (queue.length > 0) {
            sj.next(queue.shift());
        }

        if (recog.finished === true && unrecog.finished === true)
            sj.complete();
    }

    let prepareQueue = (recognizeBase: boolean) => {
        var base = recognizeBase ? recog : unrecog;
        var ref = recognizeBase ? unrecog : recog;
        //if (base.data.length === 0) return;
        while (base.data.length > 0) {
            /// 1) get time
            var basetime = base.data[0].timestamp;
            var reftime = ref.data.length > 0 ? ref.data[0].timestamp : Number.MAX_SAFE_INTEGER;
            /// 2) if >= ref timestamp, return
            if (!ref.finished && basetime > ref.timestamp) return;
            /// 3) pick one smaller
            if (basetime <= reftime) queue.push( base.data.shift() );
            else queue.push( ref.data.shift() );
        }
        queueHandler();
    }

    (async () => {
        await this.waitForLogin();

        /// handle response
        var obRecog = poll.call(this, starttime.valueOf(), endtime.valueOf(), url);
        obRecog.subscribe({
                next: (data: RecognizedUser[]) => {
                    recog.timestamp = data[data.length-1].timestamp;
                    data.forEach( (value: RecognizedUser) => value.type = UserType.Recognized );
                    recog.data.push.apply(recog.data, data);
                    prepareQueue(true);
                },
                complete: () => {
                    recog.finished = true;
                    prepareQueue(true);
                }
            });
        var obUnRecog = poll.call(this, starttime.valueOf(), endtime.valueOf(), urlnon);
        obUnRecog.subscribe({
                next: (data: UnRecognizedUser[]) => {
                    unrecog.timestamp = data[data.length-1].timestamp;
                    data.forEach( (value: UnRecognizedUser) => value.type = UserType.UnRecognized );
                    unrecog.data.push.apply(unrecog.data, data);
                    prepareQueue(false);
                },
                complete: () => {
                    unrecog.finished = true;
                    prepareQueue(false);
                }
            });

        Observable.forkJoin(obRecog, obUnRecog)
            .subscribe( () => {
                /// combine last
                var final = [ ...recog.data, ...unrecog.data ].sort( (a, b) => a.timestamp - b.timestamp );
                queue.push.apply(queue, final);
                queueHandler();
            });
    })();
    
    return sj;
}
