import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason, UserType } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

type Base64String = string;
declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        searchRecords(starttime: Date, endtime: Date, pageSize?: number): Subject<RecognizedUser | UnRecognizedUser>;
    }
}

FRSService.prototype.searchRecords = function(starttime: Date, endtime: Date, pageSize: number = 20): Subject<RecognizedUser | UnRecognizedUser> {
    var sj = new Subject<RecognizedUser | UnRecognizedUser>();

    const url: string = this.makeUrl('getverifyresultlist');
    const urlnon: string = this.makeUrl('getnonverifyresultlist');

    /// get raw data from FRS, merge all pages
    function poll(starttime: number, endtime: number, url: string, page: number = 0): Observable<RecognizedUser[] | UnRecognizedUser[]> {
        function doRequest(observer: Observer<any>, page: number = 0)  {
            let bodyparam = { session_id: this.sessionId, start_time: starttime, end_time: endtime, page_size : pageSize, skip_pages: page };
            request({
                url,
                method: 'POST',
                json: true,
                body: bodyparam
            }, (err, res, body) => {
                // /// request failed, do again
                // if (err || res.statusCode !== 200) {
                //     reject(err || body.toString());
                //     if (res.statusCode === 401) {
                //         this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                //         await this.waitForLogin();
                //     }
                //     return;
                // }

                var result = (body.result || body.group_list || {});
                var results = result.verify_results;
                if (!results || results.length === 0) {
                    observer.complete();
                    return;
                }
                observer.next(results);
                //doRequest.call(this, observer, result.page_index+1);
                setTimeout( () => doRequest.call(this, observer, result.page_index+1), 50 );
            });
        }

        return Observable.create( (observer) => {
            doRequest.call(this, observer);
        }).share();
    }

    /// indexes
    var recog = { timestamp: 0, finished: false, data: [] };
    var unrecog = { timestamp: 0, finished: false, data: [] };
    var queue = [];
    
    /// finalize search result
    async function queueHandler() {
        while (queue.length > 0) {
            sj.next(queue.shift());
        }

        if (recog.finished === true && unrecog.finished === true)
            sj.complete();
    }

    function prepareQueue(recognizeBase: boolean) {
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
