import * as Rx from 'rxjs';
import { Print, Weigand, DateTime } from '../helpers';

(async function() {
    try {
        let weigand: Weigand = new Weigand();
        weigand.ip = '172.16.11.230';
        weigand.port = 3000;
        weigand.info = { id: 123123, name: 'Weigand_01' };

        let stop$ = new Rx.Subject();

        weigand.OnData = (buffer: Buffer) => {
            let data: string = buffer
                .toString(weigand.encoding)
                .replace(/\n/g, ' ')
                .replace(/ $/, '');

            Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${weigand.info.name}, ${data}`);
        };

        weigand.OnError = async (e: Error) => {
            stop$.next();
            Print.MinLog(`${DateTime.DateTime2String(new Date(), 'HH:mm:ss')}, ${weigand.info.name}, ${e.message}`, 'error');

            weigand.Initialization();
            Control(weigand, stop$);
        };

        weigand.Initialization();

        setTimeout(async () => {
            await weigand.Write35BitCard(469, 83737, 21);
            await weigand.Write35BitCard(469, 83645, 21);
            await weigand.Write35BitCard(469, 72247, 21);
        }, 100);

        // let card: number = 12345678;
        // await weigand.WriteCard(card, Weigand.MaxCardNumber.WG26);

        // Control(weigand, stop$);
    } catch (e) {
        Print.MinLog(e, 'error');
    }
})();

async function Control(device: Weigand, stop$: Rx.Subject<{}>): Promise<void> {
    await device.Connect();

    let count: number = 12345678;
    Rx.Observable.interval(500)
        .takeUntil(stop$)
        .skip(2)
        .subscribe({
            next: async () => {
                Print.MinLog(count++, 'info');

                await device.WriteCard(count);
            },
            error: async (e: Error) => {
                await device.Disconnect();
            },
            complete: async () => {
                await device.Disconnect();
            },
        });
}
