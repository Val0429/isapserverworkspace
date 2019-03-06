import * as Rx from 'rxjs';
import { CharacterResident, PackageReceive, PackageReturn, PackagePosting, Visitor, PublicFacilityReservation, PublicNotify, PublicCalendar, Vote, Listen, PublicArticleReservation, Gas, ManageCost, MessageResident } from '../models';
import * as Enum from '../enums';
import { Print } from '../helpers';

interface IMessage {
    date: Date;
    content: string;
}

interface IMessageResident {
    resident: CharacterResident;
    type: Enum.MessageType;
    message: IMessage;
    data?: PackageReceive | PackageReturn | PackagePosting | Visitor | PublicFacilityReservation | PublicNotify | PublicCalendar | Vote | Listen | PublicArticleReservation | Gas | ManageCost;
}

export let notice$: Rx.Subject<IMessageResident> = new Rx.Subject<IMessageResident>();

(async function() {
    notice$.subscribe({
        next: async (x) => {
            let message: MessageResident = new MessageResident();

            message.setValue('resident', x.resident);
            message.setValue('type', x.type);

            if (x.data) {
                if (x.data instanceof PackageReceive) {
                    Print.MinLog('packageReceive');
                    message.setValue('packageReceive', x.data);
                } else if (x.data instanceof PackageReturn) {
                    Print.MinLog('packageReturn');
                    message.setValue('packageReturn', x.data);
                } else if (x.data instanceof PackagePosting) {
                    Print.MinLog('packagePosting');
                    message.setValue('packagePosting', x.data);
                } else if (x.data instanceof Visitor) {
                    Print.MinLog('visitor');
                    message.setValue('visitor', x.data);
                } else if (x.data instanceof PublicFacilityReservation) {
                    Print.MinLog('publicFacilityReservation');
                    message.setValue('publicFacilityReservation', x.data);
                } else if (x.data instanceof PublicNotify) {
                    Print.MinLog('publicNotify');
                    message.setValue('publicNotify', x.data);
                } else if (x.data instanceof PublicCalendar) {
                    Print.MinLog('publicCalendar');
                    message.setValue('publicCalendar', x.data);
                } else if (x.data instanceof Vote) {
                    Print.MinLog('vote');
                    message.setValue('vote', x.data);
                } else if (x.data instanceof Listen) {
                    Print.MinLog('listen');
                    message.setValue('listen', x.data);
                } else if (x.data instanceof PublicArticleReservation) {
                    Print.MinLog('publicArticleReservation');
                    message.setValue('publicArticleReservation', x.data);
                } else if (x.data instanceof Gas) {
                    Print.MinLog('gas');
                    message.setValue('gas', x.data);
                } else if (x.data instanceof ManageCost) {
                    Print.MinLog('manageCost');
                    message.setValue('manageCost', x.data);
                }
            }

            Print.MinLog(x.message.content);

            await message.save(null, { useMasterKey: true }).catch((e) => {
                Print.MinLog(e, 'error');
            });
        },
    });
})();
