import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import * as Enum from '../enums';
import { Print, DateTime, Fcm, Apn } from '../helpers';

interface IMessageResident {
    resident: IDB.CharacterResident;
    type: Enum.MessageType;
    aims?: Enum.ResidentCharacter[];
    data: IDB.PackageReceive | IDB.PackageReturn | IDB.PackagePosting | IDB.Visitor | IDB.PublicFacilityReservation | IDB.PublicNotify | IDB.PublicCalendar | IDB.Vote | IDB.Listen | IDB.PublicArticleReservation | IDB.Gas | IDB.ManageCost;
    message: IDB.IMessageContent;
}

export let notice$: Rx.Subject<IMessageResident> = new Rx.Subject<IMessageResident>();

(async function() {
    notice$.bufferTime(Config.notify.bufferTimeSecond).subscribe({
        next: async (x) => {
            try {
                let tasks: Promise<any>[] = [].concat(
                    ...(await Promise.all(
                        x.map(async (value, index, array) => {
                            let config = Config.notify[value.type];

                            if (!config.isEnable) {
                                return;
                            }

                            let _aims: Enum.ResidentCharacter[] = value.aims || config.aims;
                            let residentInfos: IDB.CharacterResidentInfo[] = await new Parse.Query(IDB.CharacterResidentInfo)
                                .equalTo('resident', value.resident)
                                .equalTo('isDeleted', false)
                                .containedIn('character', _aims)
                                .find()
                                .catch((e) => {
                                    throw e;
                                });

                            return [].concat(
                                ...(await Promise.all(
                                    residentInfos.map(async (value1, index1, array1) => {
                                        try {
                                            let body: string = config.body;
                                            if (value.message.deadline) {
                                                body = body.replace(/{{deadline}}/g, DateTime.DateTime2String(value.message.deadline, 'YYYY/MM/DD'));
                                            }
                                            if (value.message.content) {
                                                body = body.replace(/{{content}}/g, value.message.content);
                                            }
                                            if (value.message.cost) {
                                                body = body.replace(/{{cost}}/g, String(value.message.cost));
                                            }
                                            if (value.message.lendCount) {
                                                body = body.replace(/{{lendCount}}/g, String(value.message.lendCount));
                                            }
                                            if (value.message.article) {
                                                body = body.replace(/{{article}}/g, value.message.article);
                                            }
                                            if (value.message.facility) {
                                                body = body.replace(/{{facility}}/g, value.message.facility);
                                            }
                                            if (value.message.dateRange) {
                                                body = body.replace(/{{dateRange}}/g, `${DateTime.DateTime2String(value.message.dateRange.startDate)}${DateTime.DateTime2String(value.message.dateRange.endDate)}`);
                                            }
                                            if (value.message.title) {
                                                body = body.replace(/{{title}}/g, value.message.title);
                                            }
                                            if (value.message.visitor) {
                                                body = body.replace(/{{visitor}}/g, value.message.visitor);
                                            }
                                            if (value.message.sender) {
                                                body = body.replace(/{{sender}}/g, value.message.sender);
                                            }
                                            if (value.message.receiver) {
                                                body = body.replace(/{{receiver}}/g, value.message.receiver);
                                            }
                                            if (value.message.address) {
                                                body = body.replace(/{{address}}/g, value.message.address);
                                            }
                                            if (value.message.purpose) {
                                                body = body.replace(/{{purpose}}/g, value.message.purpose);
                                            }
                                            if (value.message.YYYYMMDD) {
                                                body = body.replace(/{{YYYYMMDD}}/g, DateTime.DateTime2String(value.message.YYYYMMDD, 'YYYY/MM/DD'));
                                            }
                                            if (value.message.YYYYMM) {
                                                body = body.replace(/{{YYYYMM}}/g, DateTime.DateTime2String(value.message.YYYYMM, 'YYYY/MM'));
                                            }

                                            Print.MinLog(`<${value1.id}>: ${body}`);

                                            if (value1.getValue('deviceType') === 'android') {
                                                let fcm: Fcm = new Fcm();
                                                let result: string = await fcm.Send(value1.getValue('deviceToken'), config.title, body);

                                                Print.MinLog(JSON.stringify(result), 'success');
                                            } else {
                                                let apn: Apn = new Apn();
                                                let result = await apn.Send('A54FF8224AF4CB2F245694E3C692A14CF59FBE1C842A2E7C50F91DB8E64641CB', 'Title', 'Body').catch((e) => {
                                                    Print.MinLog(e, 'error');
                                                });

                                                Print.MinLog(JSON.stringify(result), 'success');
                                            }
                                        } catch (e) {
                                            Print.MinLog(e, 'error');
                                        }

                                        let message: IDB.MessageResident = new IDB.MessageResident();

                                        message.setValue('residentInfo', value1);
                                        message.setValue('type', value.type);
                                        message.setValue('message', value.message);

                                        if (value.data) {
                                            if (value.data instanceof IDB.PackageReceive) {
                                                message.setValue('packageReceive', value.data);
                                            } else if (value.data instanceof IDB.PackageReturn) {
                                                message.setValue('packageReturn', value.data);
                                            } else if (value.data instanceof IDB.PackagePosting) {
                                                message.setValue('packagePosting', value.data);
                                            } else if (value.data instanceof IDB.Visitor) {
                                                message.setValue('visitor', value.data);
                                            } else if (value.data instanceof IDB.PublicFacilityReservation) {
                                                message.setValue('publicFacilityReservation', value.data);
                                            } else if (value.data instanceof IDB.PublicNotify) {
                                                message.setValue('publicNotify', value.data);
                                            } else if (value.data instanceof IDB.PublicCalendar) {
                                                message.setValue('publicCalendar', value.data);
                                            } else if (value.data instanceof IDB.Vote) {
                                                message.setValue('vote', value.data);
                                            } else if (value.data instanceof IDB.Listen) {
                                                message.setValue('listen', value.data);
                                            } else if (value.data instanceof IDB.PublicArticleReservation) {
                                                message.setValue('publicArticleReservation', value.data);
                                            } else if (value.data instanceof IDB.Gas) {
                                                message.setValue('gas', value.data);
                                            } else if (value.data instanceof IDB.ManageCost) {
                                                message.setValue('manageCost', value.data);
                                            }
                                        }

                                        return message.save(null, { useMasterKey: true });
                                    }),
                                )),
                            );
                        }),
                    )),
                );

                await Promise.all(tasks).catch((e) => {
                    throw e;
                });
            } catch (e) {
                Print.MinLog(e, 'error');
            }
        },
    });
})();
