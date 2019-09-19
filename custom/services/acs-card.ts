import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Utility } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { default as DataCenter } from './data-center';

class Service {
    /**
     *
     */
    private _staffCardRange: Service.IRange = undefined;

    /**
     *
     */
    private _visitorCardRange: Service.IRange = undefined;

    /**
     *
     */
    private _get$: Rx.Subject<Service.IGet> = new Rx.Subject();

    /**
     *
     */
    private _getNext$: Rx.Subject<Service.IGetNext> = new Rx.Subject();

    /**
     *
     */
    constructor() {
        DataCenter.acsSetting$
            .filter((x) => !!x)
            .subscribe({
                next: (x) => {
                    try {
                        this._staffCardRange = x.staffCardRange;
                        this._visitorCardRange = x.visitorCardRange;
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });

        DataCenter.ready$.subscribe({
            next: async () => {
                await this.Initialization();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this._staffCardRange = DataCenter.acsSetting$.value.staffCardRange;
            this._visitorCardRange = DataCenter.acsSetting$.value.visitorCardRange;

            this.EnableSaveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Enable live stream
     */
    private EnableSaveStream(): void {
        try {
            this._get$
                .zip(this._getNext$.startWith(undefined))
                .map((x) => x[0])
                .subscribe({
                    next: async (x) => {
                        let card: number = 0;

                        try {
                            let range = this._staffCardRange;
                            if (x.type === 'visitor') {
                                range = this._visitorCardRange;
                            }

                            let query: Parse.Query<IDB.ACSCard> = new Parse.Query(IDB.ACSCard).greaterThanOrEqualTo('card', range.min).lessThanOrEqualTo('card', range.max);

                            let count: number = await query.count();

                            card = range.min;
                            if (count !== 0) {
                                let acsCard: IDB.ACSCard = await query
                                    .skip(count - 1)
                                    .first()
                                    .fail((e) => {
                                        throw e;
                                    });

                                card = acsCard.getValue('card');
                                card = card === range.max ? range.min : card + 1;

                                while (true) {
                                    let check: IDB.ACSCard = await new Parse.Query(IDB.ACSCard)
                                        .equalTo('card', card)
                                        .first()
                                        .fail((e) => {
                                            throw e;
                                        });
                                    if (!check) {
                                        break;
                                    } else if (check.getValue('card') === acsCard.getValue('card')) {
                                        throw 'card was full';
                                    } else {
                                        card = card === range.max ? range.min : card + 1;
                                    }
                                }
                            }

                            let acsCard: IDB.ACSCard = new IDB.ACSCard();

                            acsCard.setValue('card', card);

                            await acsCard.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        this._getNext$.next({
                            id: x.id,
                            card: card,
                        });
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Get Next Card
     */
    public async GetNextCard(type: 'staff' | 'visitor'): Promise<number> {
        try {
            let id: string = Utility.RandomText(20, { symbol: false });

            this._get$.next({
                id: id,
                type: type,
            });

            let card: number = await new Promise<number>((resolve, reject) => {
                let next = this._getNext$
                    .filter((x) => x.id === id)
                    .subscribe({
                        next: (x) => {
                            next.unsubscribe();
                            resolve(x.card);
                        },
                    });
            });

            return card;
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {
    /**
     *
     */
    export interface IRange {
        min: number;
        max: number;
    }

    /**
     *
     */
    export interface IGet {
        id: string;
        type: 'staff' | 'visitor';
    }

    /**
     *
     */
    export interface IGetNext {
        id: string;
        card: number;
    }
}
