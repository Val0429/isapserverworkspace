import { Device } from './base';
import { Utility } from '../../utilitys';

export namespace Weigand {
    const endCharFormat = '\r\n{Max}\x03';

    /**
     *
     */
    export enum MaxCardNumber {
        WG26 = '\x1a',
        WG34 = '\x22',
    }

    /**
     *
     */
    export class Control extends Device.Control {
        protected _startChar: string = '\x02';

        protected _protocol: 'udp' = 'udp';
        public set protocol(value: 'udp') {
            this._protocol = value;
        }

        /**
         * Write card
         * @param channel
         */
        public async WriteCard(card: string, max: MaxCardNumber = MaxCardNumber.WG26): Promise<void> {
            this._endChar = endCharFormat.replace(/{Max}/g, max);
            let command: string = Utility.PadLeft(card, '0', 10);
            await this.Write(command);
        }
    }
}

// import * as Rx from 'rxjs';
// import { Print, Weigand, DateTime } from '../helpers';

// (async function () {
//     try {
//         let weigand: Weigand.Control = new Weigand.Control();
//         weigand.ip = '172.16.11.230';
//         weigand.port = 3000;
//         weigand.info = { id: 123123, name: 'Weigand_01' };

//         let stop$ = new Rx.Subject();

//         weigand.OnData = (buffer: Buffer) => {
//             let data: string = buffer
//                 .toString(weigand.encoding)
//                 .replace(/\n/g, ' ')
//                 .replace(/ $/, '');

//             Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${weigand.info.name}, ${data}`);
//         };

//         weigand.OnError = async (e: Error) => {
//             stop$.next();
//             Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${weigand.info.name}, ${e.message}`, 'error');

//             weigand.Initialization();
//             Control(weigand, stop$);
//         };

//         weigand.Initialization();

//         Control(weigand, stop$);
//     } catch (e) {
//         Print.MinLog(e, 'error');
//     }
// })();

// async function Control(device: Weigand.Control, stop$: Rx.Subject<{}>): Promise<void> {
//     await device.Connect();

//     let count: number = 12345678;
//     Rx.Observable.interval(500)
//         .takeUntil(stop$)
//         .skip(2)
//         .subscribe({
//             next: async () => {
//                 Print.MinLog(count++, 'info');

//                 await device.WriteCard(count.toString());
//             },
//             error: async (e: Error) => {
//                 await device.Disconnect();
//             },
//             complete: async () => {
//                 await device.Disconnect();
//             },
//         });
// }
