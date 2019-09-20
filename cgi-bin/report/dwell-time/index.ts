import { IUser, Action, Restful, RoleList, Errors, Socket, IBase } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { Report } from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IReport.IDwellTimeIndex;

type OutputR = IResponse.IDataList<IResponse.IReport.IDwellTimeIndex>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            Object.keys(_input).forEach((value, index, array) => {
                if (_input[value] === 'undefined') {
                    delete _input[value];
                }
            });

            let report = new ReportDwellTime();
            report.mode = Enum.EDeviceMode.dwellTime;

            await report.Initialization(_input, _userInfo.siteIds);

            report.Dispose();
            report = null;

            return {
                paging: {
                    total: 0,
                    totalPages: 0,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: [],
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportDwellTime extends Report {
    /**
     *
     */
    private _reports: IDB.ReportDwellTime[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.IIndexBase, userSiteIds: string[]): Promise<void> {
        try {
            this._isEnableOfficeHour = false;
            this._isEnableWeather = false;
            await super.Initialization(input, userSiteIds);

            let report = await this.GetReport(IDB.ReportDwellTime, [], input.startDate, input.endDate);
            this._reports = report.reports;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Dispose
     */
    public Dispose() {
        try {
            this._reports.length = 0;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }
}
