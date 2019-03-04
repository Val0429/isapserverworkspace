import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicArticle, PublicArticleReservation, CharacterResident, CharacterResidentInfo } from '../../custom/models';
import * as Enum from '../../custom/enums';
import { Print } from '../../custom/helpers';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let publicArticle: PublicArticle = await new Parse.Query(PublicArticle).get(_input.publicArticleId).catch((e) => {
            throw e;
        });
        if (!publicArticle) {
            throw Errors.throw(Errors.CustomBadRequest, ['public article not found']);
        }
        if (publicArticle.getValue('adjustCount') - publicArticle.getValue('lendCount') < _input.lendCount) {
            throw Errors.throw(Errors.CustomBadRequest, ['lend count not enough']);
        }

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let reservation: PublicArticleReservation = new PublicArticleReservation();

        reservation.setValue('creator', data.user);
        reservation.setValue('article', publicArticle);
        reservation.setValue('resident', resident);
        reservation.setValue('lendCount', _input.lendCount);
        reservation.setValue('replyDate', undefined);
        reservation.setValue('status', Enum.ReceiveStatus.unreceived);

        await reservation.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        publicArticle.setValue('lendCount', publicArticle.getValue('lendCount') + _input.lendCount);

        await publicArticle.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            reservationId: reservation.id,
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let start: Date = new Date(new Date(_input.date).setHours(0, 0, 0, 0));
        let end: Date = new Date(new Date(start).setDate(start.getDate() + 1));

        let query: Parse.Query<PublicArticleReservation> = new Parse.Query(PublicArticleReservation)
            .greaterThanOrEqualTo('createdAt', start)
            .lessThan('createdAt', end)
            .include('article');
        if (_input.publicArticleId) {
            let article: PublicArticle = new PublicArticle();
            article.id = _input.publicArticleId;

            query.equalTo('article', article);
        }
        if (_input.status === 'received') {
            query.equalTo('status', Enum.ReceiveStatus.received);
        } else if (_input.status === 'unreceived') {
            query.equalTo('status', Enum.ReceiveStatus.unreceived);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let reservations: PublicArticleReservation[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = reservations.map((value, index, array) => {
            return new Parse.Query(CharacterResidentInfo)
                .equalTo('resident', value.getValue('resident'))
                .first()
                .catch((e) => {
                    throw e;
                });
        });
        let residentInfos: CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
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
                    residentId: value.getValue('resident').id,
                    residentname: residentInfos[index] ? residentInfos[index].getValue('name') : '',
                    residentAddress: value.getValue('resident').getValue('address'),
                    lendCount: value.getValue('lendCount'),
                    lendDate: value.createdAt,
                    replyDate: value.getValue('replyDate'),
                    status: value.getValue('status'),
                };
            }),
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let reservation: PublicArticleReservation = await new Parse.Query(PublicArticleReservation)
            .include('article')
            .get(_input.reservationId)
            .catch((e) => {
                throw e;
            });
        if (!reservation) {
            throw Errors.throw(Errors.CustomBadRequest, ['reservation not found']);
        }
        if (reservation.getValue('lendCount') < _input.count) {
            throw Errors.throw(Errors.CustomBadRequest, ['count error']);
        }

        reservation.setValue('lendCount', reservation.getValue('lendCount') - _input.count);
        reservation.setValue('replyDate', new Date());
        reservation.setValue('status', reservation.getValue('lendCount') === 0 ? Enum.ReceiveStatus.received : Enum.ReceiveStatus.unreceived);
        reservation.getValue('article').setValue('lendCount', reservation.getValue('article').getValue('lendCount') - _input.count);

        await reservation.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _reservationIds: string[] = [].concat(data.parameters.reservationIds);

        _reservationIds = _reservationIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _reservationIds.map((value, index, array) => {
            return new Parse.Query(PublicArticleReservation).include('article').get(value);
        });
        let reservations: PublicArticleReservation[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = [].concat(
            reservations.map((value, index, array) => {
                value.getValue('article').setValue('lendCount', value.getValue('article').getValue('lendCount') - value.getValue('lendCount'));

                return [value.destroy({ useMasterKey: true }), value.getValue('article').save(null, { useMasterKey: true })];
            }),
        );
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
