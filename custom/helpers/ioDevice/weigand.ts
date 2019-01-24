import { IoDevice } from './base';
import { Utility, Print, Parser } from '../utilitys';

/**
 *
 */
export class Weigand extends IoDevice {
    protected _endCharFormat = '\r\n{Max}\x03';

    protected _startChar: string = '\x02';

    protected _protocol: 'udp' = 'udp';
    public set protocol(value: 'udp') {
        this._protocol = value;
    }

    /**
     * Write card
     * @param channel
     */
    public async WriteCard(card: number, max: Weigand.MaxCardNumber = Weigand.MaxCardNumber.WG26): Promise<void> {
        this._endChar = this._endCharFormat.replace(/{Max}/g, max);
        let command: string = Utility.PadLeft(card.toString(), '0', 10);
        await this.Write(command);
    }

    /**
     * Write 35 bit card
     * @param cardHead
     * @param cardBody
     * @param cardFooter
     */
    public async Write35BitCard(cardHead: number, cardBody: number, cardFooter: number): Promise<void> {
        let p1s: number[] = [3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34];
        let p2s: number[] = [2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33];

        let card: string = `${Utility.PadLeft(cardHead.toString(2), '0', 12)}${Utility.PadLeft(cardBody.toString(2), '0', 20)}`;
        let cards: number[] = card
            .split('')
            .reverse()
            .map(Number);

        let p2: number = cards.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + (p2s.indexOf(currentIndex + 2) >= 0 ? currentValue : 0);
        });
        p2 = p2 % 2 === 1 ? 1 : 0;

        let p1: number = cards.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + (p1s.indexOf(currentIndex + 2) >= 0 ? currentValue : 0);
        });
        p1 = (p1 + p2 - cards[0]) % 2 === 1 ? 0 : 1;

        let p3: number = cards.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + currentValue;
        });
        p3 = (p3 + p1 + p2) % 2 === 1 ? 0 : 1;

        card = `${p3}${p2}${card}${p1}${cardFooter.toString(2)}`;

        let data: string = parseInt(card, 2).toString(16);
        data = Utility.PadLeft(data, '0', data.length + (data.length % 2));

        let datas: number[] = data.match(/.{2}/g).map((value, index, array) => {
            return parseInt(value, 16);
        });
        for (let i: number = datas.length; i < 9; i++) {
            datas.push(parseInt('0', 16));
        }

        this._endChar = `${Weigand.MaxCardNumber.WG35}${this._endCharFormat.replace(/{Max}/g, '')}`;

        await this.Write(Buffer.from(datas));
    }
}

export namespace Weigand {
    /**
     *
     */
    export enum MaxCardNumber {
        WG26 = '\x1a',
        WG34 = '\x22',
        WG35 = '\x23',
    }
}

// import * as Rx from 'rxjs';
// import { Print, Weigand, DateTime } from '../helpers';

// (async function() {
//     try {
//         let weigand: Weigand = new Weigand();
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

// async function Control(device: Weigand, stop$: Rx.Subject<{}>): Promise<void> {
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
