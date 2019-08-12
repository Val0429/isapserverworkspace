import { IUser, Action, Restful, RoleList, Errors, Socket, Config, ParseObject } from 'core/cgi-package';
import { WorkPermit, IWorkPermitPerson, IWorkPermitAccessGroup, EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = {
    verify: string;
};

type OutputR = {
    status: string;
    contact: string;
    contactEmail: string;
    pdpaAccepted: boolean;
    ptwId: string;
    company: {
        objectId: string;
        name: string;
    };
    workCategory: string;
    applicantName: string;
    contractorCompanyName: string;
    contractorCompanyAddress: string;
    contractorCompanyEmail: string;
    contractorCompanyContactPhone: string;
    contractorCompanyFax: string;
    workPremisesUnit: string;
    workLocation: string;
    workDescription: string;
    workType1: boolean;
    workType2: boolean;
    workType3: boolean;
    workType4: boolean;
    workType5: boolean;
    workType6: boolean;
    workType7: boolean;
    workType8: boolean;
    workStartDate: Date;
    workStartTime: Date;
    workEndDate: Date;
    workEndTime: Date;
    workContact: string;
    workContactPhone: string;
    checklist1: boolean;
    checklistRemark1: string;
    checklist2: boolean;
    checklistRemark2: string;
    checklist3: boolean;
    checklistRemark3: string;
    checklist4: boolean;
    checklistRemark4: string;
    checklist5: boolean;
    checklistRemark5: string;
    checklist6: boolean;
    checklistRemark6: string;
    checklist7: boolean;
    checklistRemark7: string;
    checklist8: boolean;
    checklist9: boolean;
    attachments: string[];
    termsAccepted: boolean;
    persons: IWorkPermitPerson[];
    personNames: string[];
    accessGroups: IWorkPermitAccessGroup[];
};

action.get(
    {
        inputType: 'InputR',
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let work: WorkPermit = await new Parse.Query(WorkPermit)
                .equalTo('verify', _input.verify)
                .include('company')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomNotFound);
            }

            return {
                status: EWorkPermitStatus[work.getValue('status')],
                contact: work.getValue('contact'),
                contactEmail: work.getValue('contactEmail'),
                pdpaAccepted: work.getValue('pdpaAccepted'),
                ptwId: work.getValue('ptwId'),
                company: {
                    objectId: work.getValue('company').id,
                    name: work.getValue('company').getValue('name'),
                },
                workCategory: work.getValue('workCategory'),
                applicantName: work.getValue('applicantName'),
                contractorCompanyName: work.getValue('contractorCompanyName'),
                contractorCompanyAddress: work.getValue('contractorCompanyAddress'),
                contractorCompanyEmail: work.getValue('contractorCompanyEmail'),
                contractorCompanyContactPhone: work.getValue('contractorCompanyContactPhone'),
                contractorCompanyFax: work.getValue('contractorCompanyFax'),
                workPremisesUnit: work.getValue('workPremisesUnit'),
                workLocation: work.getValue('workLocation'),
                workDescription: work.getValue('workDescription'),
                workType1: work.getValue('workType1'),
                workType2: work.getValue('workType2'),
                workType3: work.getValue('workType3'),
                workType4: work.getValue('workType4'),
                workType5: work.getValue('workType5'),
                workType6: work.getValue('workType6'),
                workType7: work.getValue('workType7'),
                workType8: work.getValue('workType8'),
                workStartDate: work.getValue('workStartDate'),
                workStartTime: work.getValue('workStartTime'),
                workEndDate: work.getValue('workEndDate'),
                workEndTime: work.getValue('workEndTime'),
                workContact: work.getValue('workContact'),
                workContactPhone: work.getValue('workContactPhone'),
                checklist1: work.getValue('checklist1'),
                checklistRemark1: work.getValue('checklistRemark1'),
                checklist2: work.getValue('checklist2'),
                checklistRemark2: work.getValue('checklistRemark2'),
                checklist3: work.getValue('checklist3'),
                checklistRemark3: work.getValue('checklistRemark3'),
                checklist4: work.getValue('checklist4'),
                checklistRemark4: work.getValue('checklistRemark4'),
                checklist5: work.getValue('checklist5'),
                checklistRemark5: work.getValue('checklistRemark5'),
                checklist6: work.getValue('checklist6'),
                checklistRemark6: work.getValue('checklistRemark6'),
                checklist7: work.getValue('checklist7'),
                checklistRemark7: work.getValue('checklistRemark7'),
                checklist8: work.getValue('checklist8'),
                checklist9: work.getValue('checklist9'),
                attachments: work.getValue('attachments').map((n) => n.url()),
                termsAccepted: work.getValue('termsAccepted'),
                persons: work.getValue('persons'),
                personNames: work.getValue('personNames'),
                accessGroups: work.getValue('accessGroups'),
            };
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = {
    verify: string;
    contact?: string;
    contactEmail?: string;
    pdpaAccepted?: boolean;
    applicantName?: string;
    contractorCompanyName?: string;
    contractorCompanyAddress?: string;
    contractorCompanyEmail?: string;
    contractorCompanyContactPhone?: string;
    contractorCompanyFax?: string;
    workPremisesUnit?: string;
    workLocation?: string;
    workDescription?: string;
    workType1?: boolean;
    workType2?: boolean;
    workType3?: boolean;
    workType4?: boolean;
    workType5?: boolean;
    workType6?: boolean;
    workType7?: boolean;
    workType8?: boolean;
    workStartDate?: Date;
    workStartTime?: Date;
    workEndDate?: Date;
    workEndTime?: Date;
    workContact?: string;
    workContactPhone?: string;
    checklist1?: boolean;
    checklistRemark1?: string;
    checklist2?: boolean;
    checklistRemark2?: string;
    checklist3?: boolean;
    checklistRemark3?: string;
    checklist4?: boolean;
    checklistRemark4?: string;
    checklist5?: boolean;
    checklistRemark5?: string;
    checklist6?: boolean;
    checklistRemark6?: string;
    checklist7?: boolean;
    checklistRemark7?: string;
    checklist8?: boolean;
    checklist9?: boolean;
    attachments?: Parse.File[];
    termsAccepted?: boolean;
    persons?: IWorkPermitPerson[];
    accessGroups?: IWorkPermitAccessGroup[];
};

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 100000000,
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let work: WorkPermit = await new Parse.Query(WorkPermit)
                .equalTo('verify', _input.verify)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            delete _input.verify;

            await work.save(_input, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);
