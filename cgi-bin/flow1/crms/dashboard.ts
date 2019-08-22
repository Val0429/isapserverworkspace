import { IUser, Action, Restful, RoleList, Errors, Socket, Config, EventFlow1StrictTryCheckIn } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, IFlow1WorkPermitPerson as IWorkPermitPerson, IFlow1WorkPermitAccessGroup as IWorkPermitAccessGroup, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator],
});

export default action;

/**
 * Action Create
 */
type InputC =
    | {
          startDate: Date;
          endDate: Date;
      }
    | {};

interface IDateCount {
    date: Date;
    count: number;
}

type OutputC = {
    leftTop: {
        new: number;
        pendding: number;
        approve: number;
    };
    rightTop: IDateCount[];
    bottom: IDateCount[];
};

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let startDate: Date = undefined;
            let endDate: Date = undefined;
            if ('startDate' in _input) {
                startDate = _input.startDate;
                endDate = _input.endDate;
            } else {
                let dt = new Date();
                dt.setHours(0, 0, 0, 0);

                startDate = dt;
                endDate = new Date(new Date(dt).setDate(dt.getDate() + 1));
            }

            let work: WorkPermit[] = await new Parse.Query(WorkPermit)
                .greaterThanOrEqualTo('workStartDate', startDate)
                .lessThan('workEndDate', endDate)
                .find()
                .fail((e) => {
                    throw e;
                });

            let newCount: number = 0;
            let penddingCount: number = 0;
            let approveCount: number = 0;
            work.forEach((value, index, array) => {
                switch (value.getValue('status')) {
                    case EWorkPermitStatus.new:
                        newCount += 1;
                        break;
                    case EWorkPermitStatus.pendding:
                        penddingCount += 1;
                        break;
                    case EWorkPermitStatus.approve:
                        approveCount += 1;
                        break;
                }
            });

            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);

            startDate.setDate(startDate.getDate() - 2);
            endDate.setDate(endDate.getDate() + 1);

            let event: EventFlow1StrictTryCheckIn[] = await new Parse.Query(EventFlow1StrictTryCheckIn)
                .greaterThanOrEqualTo('updatedAt', startDate)
                .lessThan('updatedAt', endDate)
                .find()
                .fail((e) => {
                    throw e;
                });

            let byHours: IDateCount[] = [];
            let byDays: IDateCount[] = [];
            event.forEach((value, index, array) => {
                let hour: Date = new Date(new Date(value.createdAt).setMinutes(0, 0, 0));

                let date: Date = new Date(new Date(hour).setHours(0, 0, 0, 0));

                if (date.getDate() === new Date().getDate()) {
                    let summary = byHours.find((value1, index1, array1) => {
                        return value1.date.getTime() === hour.getTime();
                    });
                    if (summary) {
                        summary.count += 1;
                    } else {
                        byHours.push({
                            date: new Date(hour),
                            count: 1,
                        });
                    }
                } else {
                    let summary = byDays.find((value1, index1, array1) => {
                        return value1.date.getTime() === date.getTime();
                    });
                    if (summary) {
                        summary.count += 1;
                    } else {
                        byDays.push({
                            date: new Date(date),
                            count: 1,
                        });
                    }
                }
            });

            return {
                leftTop: {
                    new: newCount,
                    pendding: penddingCount,
                    approve: approveCount,
                },
                rightTop: byHours,
                bottom: byDays,
            };
        } catch (e) {
            throw e;
        }
    },
);
