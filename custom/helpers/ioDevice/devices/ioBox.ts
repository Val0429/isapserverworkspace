import { Device } from './base';
import { Parser } from '../..';

export namespace IoBox {
    /**
     *
     */
    export enum Status {
        open = '1',
        close = '0',
    }

    /**
     *
     */
    export enum OutputChannel {
        ch1 = '1',
        ch2 = '2',
    }

    /**
     *
     */
    export enum InputChannel {
        ch1 = '1',
    }

    /**
     *
     */
    export class Control extends Device.Control {
        protected _encoding: Parser.Encoding = Parser.Encoding.ascii;
        protected _endChar: string = '\n';

        /**
         * Set output status
         * @param channel
         * @param status
         * @param delay
         */
        public async SetOutputStatus(channel: OutputChannel, status: Status, delay?: number): Promise<any> {
            let command: string = `AT+STACH${channel}=${status}${delay === null || delay === undefined ? '' : `,${delay}`}`;
            await this.Write(command);
        }

        /**
         * Get output status
         * @param channel
         */
        public async GetOutputStatus(channel: OutputChannel): Promise<any> {
            let command: string = `AT+STACH${channel}=?`;
            await this.Write(command);
        }

        /**
         * Get input status
         * @param channel
         */
        public async GetInputStatus(channel: InputChannel): Promise<any> {
            let command: string = `AT+OCCH${channel}=?`;
            await this.Write(command);
        }
    }
}

// import * as Rx from 'rxjs';
// import { Print, IoBox, DateTime } from '../helpers';

// (async function () {
//     try {
//         let iobox: IoBox.Control = new IoBox.Control();
//         iobox.ip = '192.168.1.98';
//         iobox.port = 12345;
//         iobox.info = { id: 123123, name: 'IoBox_01' };

//         let stop$ = new Rx.Subject();

//         iobox.OnData = (buffer: Buffer) => {
//             let data: string = buffer
//                 .toString(iobox.encoding)
//                 .replace(/\n/g, ' ')
//                 .replace(/ $/, '');

//             let messages: string[] = data.split(' ');

//             for (let message of messages) {
//                 if (/^\+STACH[0-9]+:[0-9]+,[0-9]*$/.test(message)) {
//                     let datas: string[] = message.match(/[0-9]+/g);

//                     message = `Output => Channel: ${datas[0]}, Status: ${datas[1]}, Delay: ${datas[2]}`;
//                 } else if (/^\+OCCH[0-9]+:[0-9]+$/.test(message)) {
//                     let datas: string[] = message.match(/[0-9]+/g);

//                     message = ` Input => Channel: ${datas[0]}, Status: ${datas[1]}`;
//                 } else {
//                     return;
//                 }

//                 Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${iobox.info.name}, ${message}`);
//             }
//         };

//         iobox.OnError = async (e: Error) => {
//             stop$.next();
//             Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${iobox.info.name}, ${e.message}`, 'error');

//             iobox.Initialization();
//             Control(iobox, stop$);
//         };

//         iobox.Initialization();
//         Control(iobox, stop$);
//     } catch (e) {
//         Print.MinLog(e, 'error');
//     }
// })();

// async function Control(iobox: IoBox.Control, stop$: Rx.Subject<{}>): Promise<void> {
//     await iobox.Connect();

//     let count: number = 0;
//     Rx.Observable.interval(500)
//         .takeUntil(stop$)
//         .skip(2)
//         .subscribe({
//             next: async () => {
//                 Print.MinLog(count++, 'info');

//                 await iobox.GetOutputStatus(IoBox.OutputChannel.ch1);
//                 await iobox.GetOutputStatus(IoBox.OutputChannel.ch2);
//                 await iobox.GetInputStatus(IoBox.InputChannel.ch1);

//                 console.log();
//             },
//             error: async (e: Error) => {
//                 await iobox.Disconnect();
//             },
//             complete: async () => {
//                 await iobox.Disconnect();
//             },
//         });
// }
