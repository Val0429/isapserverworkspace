import { IUser, Action, Restful, RoleList, Errors, Socket, Config, Flow1Companies, Flow1Purposes } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, IFlow1WorkPermitPerson as IWorkPermitPerson, IFlow1WorkPermitAccessGroup as IWorkPermitAccessGroup, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import { Excel, DateTime, File } from './__api__';
import { Utility } from 'workspace/custom/services/crms-service/cgi-bin/crms/__api__';

type Companies = Flow1Companies;
let Companies = Flow1Companies;

type Purposes = Flow1Purposes;
let Purposes = Flow1Purposes;

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator],
});

export default action;

/**
 * Action Create
 */
interface IInputPaging {
    page?: number;
    pageSize?: number;
}
type InputC = {
    paging?: IInputPaging;
    startDate?: Date;
    endDate?: Date;
    status?: EWorkPermitStatus;
    ptwId?: string;
    contactEmail?: string;
    companyId?: string;
    workCategoryId?: string;
    workType?: number;
    workPremisesUnit?: string;
    applicantName?: string;
    contractorCompanyName?: string;
    personName?: string;
};
type OutputC = string;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let _paging: IInputPaging = _input.paging || { page: 1, pageSize: 10 };
            _paging.page = _paging.page || 1;
            _paging.pageSize = _paging.pageSize || 10;

            let query: Parse.Query<WorkPermit> = new Parse.Query(WorkPermit);

            if (_input.startDate) {
                query.greaterThanOrEqualTo('workStartDate', _input.startDate);
            }
            if (_input.endDate) {
                query.lessThan('workEndDate', _input.endDate);
            }
            if (_input.status) {
                query.equalTo('status', _input.status);
            }
            if (_input.ptwId) {
                query.equalTo('ptwId', _input.ptwId);
            }
            if (_input.contactEmail) {
                query.matches('contactEmail', new RegExp(_input.contactEmail), 'i');
            }
            if (_input.companyId) {
                let company: Companies = new Companies();
                company.id = _input.companyId;
                query.equalTo('company', company);
            }
            if (_input.workCategoryId) {
                let workCategory: Purposes = new Purposes();
                workCategory.id = _input.workCategoryId;
                query.equalTo('workCategory', workCategory);
            }
            if (_input.workType) {
                query.equalTo(`workType${_input.workType}`, true);
            }
            if (_input.workPremisesUnit) {
                query.matches('workPremisesUnit', new RegExp(_input.workPremisesUnit), 'i');
            }
            if (_input.applicantName) {
                query.matches('applicantName', new RegExp(_input.applicantName), 'i');
            }
            if (_input.contractorCompanyName) {
                query.matches('contractorCompanyName', new RegExp(_input.contractorCompanyName), 'i');
            }
            if (_input.personName) {
                query.matches('personNames', new RegExp(_input.personName), 'i');
            }

            let works: WorkPermit[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['company', 'workCategory'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let workbook = Excel.GenerateWorkBook([
                {
                    name: 'report',
                    data: works.map((value, index, array) => {
                        let status: string = '';
                        switch (value.getValue('status')) {
                            case EWorkPermitStatus.approve:
                                status = 'Approved';
                                break;
                            case EWorkPermitStatus.new:
                                status = 'New';
                                break;
                            case EWorkPermitStatus.pendding:
                                status = 'Pendding Approval';
                                break;
                            case EWorkPermitStatus.reject:
                                status = 'Rejected';
                                break;
                        }

                        return {
                            No: index + 1,
                            'PTW ID': value.getValue('ptwId'),
                            'PTW Status': status,
                            Email: value.getValue('contactEmail'),
                            Tenant: value.getValue('company').getValue('name'),
                            'Unit #': value.getValue('workPremisesUnit'),
                            'Work Category': value.getValue('workCategory').getValue('name'),
                            'Start Date': DateTime.ToString(value.getValue('workStartDate'), 'DD-MM-YYYY'),
                            'End Date': DateTime.ToString(value.getValue('workEndDate'), 'DD-MM-YYYY'),
                            'Contractor Company': value.getValue('contractorCompanyName'),
                        };
                    }),
                },
            ]);

            let path: string = './workspace/custom/assets';
            let filename: string = `/export/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.xlsx`;
            Excel.Write(`${path}${filename}`, workbook);

            return filename;
        } catch (e) {
            throw e;
        }
    },
);
