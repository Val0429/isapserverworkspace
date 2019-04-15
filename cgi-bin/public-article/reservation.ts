import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicArticle.IReservationC;

type OutputC = IResponse.IPublicArticle.IReservationC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let publicArticle: IDB.PublicArticle = await new Parse.Query(IDB.PublicArticle).get(_input.publicArticleId).fail((e) => {
                throw e;
            });
            if (!publicArticle) {
                throw Errors.throw(Errors.CustomBadRequest, ['public article not found']);
            }
            if (publicArticle.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['public article was deleted']);
            }
            if (publicArticle.getValue('adjustCount') - publicArticle.getValue('lendCount') < _input.lendCount) {
                throw Errors.throw(Errors.CustomBadRequest, ['lend count not enough']);
            }

            let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).fail((e) => {
                throw e;
            });
            if (!resident) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
            }

            let reservation: IDB.PublicArticleReservation = new IDB.PublicArticleReservation();

            reservation.setValue('creator', data.user);
            reservation.setValue('community', _userInfo.community);
            reservation.setValue('article', publicArticle);
            reservation.setValue('resident', resident);
            reservation.setValue('lendCount', _input.lendCount);
            reservation.setValue('replyDate', undefined);
            reservation.setValue('status', Enum.ReceiveStatus.unreceived);
            reservation.setValue('isDeleted', false);

            await reservation.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            publicArticle.setValue('lendCount', publicArticle.getValue('lendCount') + _input.lendCount);

            await publicArticle.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: reservation.getValue('resident'),
                type: Enum.MessageType.publicArticleReservationNew,
                data: reservation,
                message: {
                    YYYYMMDD: new Date(),
                    article: publicArticle.getValue('name'),
                    lendCount: reservation.getValue('lendCount'),
                },
            });

            return {
                reservationId: reservation.id,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPublicArticle.IReservationR;

type OutputR = IResponse.IDataList<IResponse.IPublicArticle.IReservationR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let start: Date = new Date(new Date(_input.date).setHours(0, 0, 0, 0));
            let end: Date = new Date(new Date(start).setDate(start.getDate() + 1));

            let query: Parse.Query<IDB.PublicArticleReservation> = new Parse.Query(IDB.PublicArticleReservation).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

            if (_input.publicArticleId) {
                let article: IDB.PublicArticle = new IDB.PublicArticle();
                article.id = _input.publicArticleId;

                query.equalTo('article', article);
            }
            if (_input.status === 'received') {
                query.equalTo('status', Enum.ReceiveStatus.received);
            } else if (_input.status === 'unreceived') {
                query.equalTo('status', Enum.ReceiveStatus.unreceived);
            }
            if (_input.date) {
                query.greaterThanOrEqualTo('createdAt', start).lessThan('createdAt', end);
            }

            if (_userInfo.resident) {
                query.equalTo('resident', _userInfo.resident);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let reservations: IDB.PublicArticleReservation[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .include(['resident', 'replier', 'article'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let tasks: Promise<any>[] = reservations.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterResidentInfo)
                    .equalTo('resident', value.getValue('resident'))
                    .equalTo('isDeleted', false)
                    .first();
            });
            let residentInfos: IDB.CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = reservations.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value.getValue('replier')).first();
            });
            let repliers: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return {
                total: total,
                page: _page,
                count: _count,
                content: reservations.map((value, index, array) => {
                    return {
                        reservationId: value.id,
                        articleId: value.getValue('article').id,
                        articleName: value.getValue('article').getValue('name'),
                        articleType: value.getValue('article').getValue('type'),
                        articleLessCount: value.getValue('article').getValue('adjustCount') - value.getValue('article').getValue('lendCount'),
                        articleIsDeleted: value.getValue('article').getValue('isDeleted'),
                        residentId: value.getValue('resident').id,
                        residentname: residentInfos[index] ? residentInfos[index].getValue('name') : '',
                        residentAddress: value.getValue('resident').getValue('address'),
                        lendCount: value.getValue('lendCount'),
                        lendDate: value.createdAt,
                        replierName: repliers[index] ? repliers[index].getValue('name') : '',
                        replyDate: value.getValue('replyDate'),
                        status: value.getValue('status'),
                    };
                }),
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPublicArticle.IReservationU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let reservation: IDB.PublicArticleReservation = await new Parse.Query(IDB.PublicArticleReservation)
                .include('article')
                .get(_input.reservationId)
                .fail((e) => {
                    throw e;
                });
            if (!reservation) {
                throw Errors.throw(Errors.CustomBadRequest, ['reservation not found']);
            }
            if (reservation.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['reservation was deleted']);
            }
            if (reservation.getValue('status') === Enum.ReceiveStatus.received) {
                throw Errors.throw(Errors.CustomBadRequest, ['received']);
            }
            if (reservation.getValue('lendCount') < _input.count) {
                throw Errors.throw(Errors.CustomBadRequest, ['count error']);
            }

            reservation.setValue('lendCount', reservation.getValue('lendCount') - _input.count);
            reservation.setValue('replier', data.user);
            reservation.setValue('replyDate', new Date());
            reservation.setValue('status', reservation.getValue('lendCount') === 0 ? Enum.ReceiveStatus.received : Enum.ReceiveStatus.unreceived);
            reservation.getValue('article').setValue('lendCount', reservation.getValue('article').getValue('lendCount') - _input.count);

            await reservation.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: reservation.getValue('resident'),
                type: Enum.MessageType.publicArticleReservationReply,
                data: reservation,
                message: {
                    YYYYMMDD: new Date(),
                    article: reservation.getValue('article').getValue('name'),
                    cost: _input.count,
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IPublicArticle.IReservationD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _reservationIds: string[] = [].concat(data.parameters.reservationIds);

            _reservationIds = _reservationIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _reservationIds.map<any>((value, index, array) => {
                return new Parse.Query(IDB.PublicArticleReservation).include('article').get(value);
            });
            let reservations: IDB.PublicArticleReservation[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = [].concat(
                ...reservations.map((value, index, array) => {
                    value.setValue('isDeleted', true);
                    value.getValue('article').setValue('lendCount', value.getValue('article').getValue('lendCount') - value.getValue('lendCount'));

                    return [value.save(null, { useMasterKey: true }), value.getValue('article').save(null, { useMasterKey: true })];
                }),
            );
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            reservations.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value.getValue('resident'),
                    type: Enum.MessageType.publicArticleReservationDelete,
                    message: {},
                    data: value,
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
