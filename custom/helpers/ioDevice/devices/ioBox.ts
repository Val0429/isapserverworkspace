import { Device } from './base';
import { Parser, Print } from '../..';

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
         *
         * @param message
         */
        public async Write(message: string): Promise<void> {
            await new Promise((resolve, reject) => {
                this._client.once('data', () => resolve());
                super.Write(message);
            });
        }

        /**
         *
         * @param channel
         * @param status
         * @param delay
         */
        public async SetOutputStatus(channel: OutputChannel, status: Status, delay?: number): Promise<any> {
            let command: string = `AT+STACH${channel}=${status}${delay === null || delay === undefined ? '' : `,${delay}`}`;
            await this.Write(command);
        }

        /**
         *
         * @param channel
         */
        public async GetOutputStatus(channel: OutputChannel): Promise<any> {
            let command: string = `AT+STACH${channel}=?`;
            await this.Write(command);
        }

        /**
         *
         * @param channel
         */
        public async GetInputStatus(channel: InputChannel): Promise<any> {
            let command: string = `AT+OCCH${channel}=?`;
            await this.Write(command);
        }
    }
}
