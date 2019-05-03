import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import * as Enum from '../enums';
import { Print, DateTime } from '../helpers';
import * as Action from '../actions';

interface IMessageResident {
    resident: IDB.CharacterResident;
    type: Enum.MessageType;
    aims?: Enum.ResidentCharacter[];
    data: IDB.PackageReceive | IDB.PackageReturn | IDB.PackagePosting | IDB.Visitor | IDB.PublicFacilityReservation | IDB.PublicNotify | IDB.PublicCalendar | IDB.Vote | IDB.Listen | IDB.PublicArticleReservation | IDB.Gas | IDB.ManageCost;
    message: IDB.IMessageContent;
}

export let notice$: Rx.Subject<IMessageResident> = new Rx.Subject<IMessageResident>();

(async function() {
    notice$.subscribe({
        next: async (x) => {
            try {
                let config = Config.notify[x.type];

                if (!config.isEnable) {
                    return;
                }

                let _aims: Enum.ResidentCharacter[] = x.aims || config.aims;
                let residentInfos: IDB.CharacterResidentInfo[] = await new Parse.Query(IDB.CharacterResidentInfo)
                    .equalTo('resident', x.resident)
                    .equalTo('isDeleted', false)
                    .containedIn('character', _aims)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                let body: string = ReplaceBody(config.body, x.message);

                Print.Log(`${config.title}: ${body}`, new Error(), 'message');

                residentInfos.forEach(async (value1, index1, array1) => {
                    Action.PushNotification.action$.next({
                        residentInfo: value1,
                        title: config.title,
                        body: body,
                    });
                });
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

    function ReplaceBody(body: string, message: IDB.IMessageContent): string {
        if (message.deadline) {
            body = body.replace(/{{deadline}}/g, DateTime.ToString(message.deadline, 'YYYY/MM/DD'));
        }
        if (message.content) {
            body = body.replace(/{{content}}/g, message.content);
        }
        if (message.cost) {
            body = body.replace(/{{cost}}/g, String(message.cost));
        }
        if (message.lendCount) {
            body = body.replace(/{{lendCount}}/g, String(message.lendCount));
        }
        if (message.article) {
            body = body.replace(/{{article}}/g, message.article);
        }
        if (message.facility) {
            body = body.replace(/{{facility}}/g, message.facility);
        }
        if (message.dateRange) {
            body = body.replace(/{{dateRange}}/g, `${DateTime.ToString(message.dateRange.startDate)}-${DateTime.ToString(message.dateRange.endDate)}`);
        }
        if (message.title) {
            body = body.replace(/{{title}}/g, message.title);
        }
        if (message.visitor) {
            body = body.replace(/{{visitor}}/g, message.visitor);
        }
        if (message.sender) {
            body = body.replace(/{{sender}}/g, message.sender);
        }
        if (message.receiver) {
            body = body.replace(/{{receiver}}/g, message.receiver);
        }
        if (message.address) {
            body = body.replace(/{{address}}/g, message.address);
        }
        if (message.purpose) {
            body = body.replace(/{{purpose}}/g, message.purpose);
        }
        if (message.YYYYMMDD) {
            body = body.replace(/{{YYYYMMDD}}/g, DateTime.ToString(message.YYYYMMDD, 'YYYY/MM/DD'));
        }
        if (message.YYYYMM) {
            body = body.replace(/{{YYYYMM}}/g, DateTime.ToString(message.YYYYMM, 'YYYY/MM'));
        }

        return body;
    }
})();
