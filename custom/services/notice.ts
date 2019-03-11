import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { CharacterResident, CharacterResidentInfo, MessageResident, IMessageContent, PackageReceive, PackageReturn, PackagePosting, Visitor, PublicFacilityReservation, PublicNotify, PublicCalendar, Vote, Listen, PublicArticleReservation, Gas, ManageCost } from '../models';
import * as Enum from '../enums';
import { Print } from '../helpers';

interface IMessageResident {
    resident: CharacterResident;
    type: Enum.MessageType;
    message: IMessageContent;
    aims?: Enum.ResidentCharacter[];
    data: PackageReceive | PackageReturn | PackagePosting | Visitor | PublicFacilityReservation | PublicNotify | PublicCalendar | Vote | Listen | PublicArticleReservation | Gas | ManageCost;
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
                            let residentInfos: CharacterResidentInfo[] = await new Parse.Query(CharacterResidentInfo)
                                .equalTo('resident', value.resident)
                                .containedIn('character', _aims)
                                .find()
                                .catch((e) => {
                                    throw e;
                                });

                            return residentInfos.map((value1, index1, array1) => {
                                Print.MinLog(`<${Enum.MessageType[value.type]}> ${value1.id}, ${JSON.stringify(value.message)}`);

                                // let message: MessageResident = new MessageResident();

                                // message.setValue('residentInfo', value1);
                                // message.setValue('type', value.type);
                                // message.setValue('message', value.message);

                                // if (value.data) {
                                //     if (value.data instanceof PackageReceive) {
                                //         message.setValue('packageReceive', value.data);
                                //     } else if (value.data instanceof PackageReturn) {
                                //         message.setValue('packageReturn', value.data);
                                //     } else if (value.data instanceof PackagePosting) {
                                //         message.setValue('packagePosting', value.data);
                                //     } else if (value.data instanceof Visitor) {
                                //         message.setValue('visitor', value.data);
                                //     } else if (value.data instanceof PublicFacilityReservation) {
                                //         message.setValue('publicFacilityReservation', value.data);
                                //     } else if (value.data instanceof PublicNotify) {
                                //         message.setValue('publicNotify', value.data);
                                //     } else if (value.data instanceof PublicCalendar) {
                                //         message.setValue('publicCalendar', value.data);
                                //     } else if (value.data instanceof Vote) {
                                //         message.setValue('vote', value.data);
                                //     } else if (value.data instanceof Listen) {
                                //         message.setValue('listen', value.data);
                                //     } else if (value.data instanceof PublicArticleReservation) {
                                //         message.setValue('publicArticleReservation', value.data);
                                //     } else if (value.data instanceof Gas) {
                                //         message.setValue('gas', value.data);
                                //     } else if (value.data instanceof ManageCost) {
                                //         message.setValue('manageCost', value.data);
                                //     }
                                // }

                                // return message.save(null, { useMasterKey: true });
                            });
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
