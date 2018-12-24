import * as Rx from 'rxjs';
import { Device, Print, IoBox } from '../helpers';

(async function() {
    try {
        let iobox: IoBox.Control = new IoBox.Control();
        let info: Device.IInfo = {
            id: 123123,
            name: 'Io_Box_01',
        };
        let connect: Device.IConnect = {
            ip: '172.16.11.226',
            port: 12345,
        };

        // iobox.OnConnect = () => {};

        // iobox.OnClose = () => {};

        iobox.OnData = (buffer: Buffer) => {
            let message: string = buffer
                .toString()
                .replace(/\n/g, ',')
                .replace(/,$/, '');

            if (message === 'OK') {
                return;
            } else if (/^\+STACH[0-9]+:[0-9]+,[0-9]*$/.test(message)) {
                let datas: string[] = message.match(/[0-9]+/g);

                message = `Output => Channel: ${datas[0]}, Status: ${datas[1]}, Delay: ${datas[2]}`;
            } else if (/^\+OCCH[0-9]+:[0-9]+$/.test(message)) {
                let datas: string[] = message.match(/[0-9]+/g);

                message = `Input => Channel: ${datas[0]}, Status: ${datas[1]}`;
            }

            Print.MinLog(`${iobox.deviceConnect.ip}:${iobox.deviceConnect.port}: ${message}`);
        };

        iobox.Initialization(info, connect);

        let count: number = 0;

        Rx.Observable.interval(500)
            .do(async () => {
                await iobox.Connect();
            })
            .skip(2)
            .subscribe({
                next: async () => {
                    Print.MinLog(count++, 'info');

                    await iobox.GetOutputStatus(IoBox.OutputChannel.ch1);
                    await iobox.GetInputStatus(IoBox.InputChannel.ch1);

                    console.log();
                },
            });
    } catch (e) {
        Print.MinLog(e, 'error');
    }
})();
