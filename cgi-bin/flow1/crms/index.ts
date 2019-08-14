import { IUser, Action, Restful, RoleList, Errors, Socket, Config, Flow1Companies, Flow1Purposes, IFlow1InvitationDateUnit, FileHelper } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, IFlow1WorkPermitPerson as IWorkPermitPerson, IFlow1WorkPermitAccessGroup as IWorkPermitAccessGroup, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import pinCode from 'services/pin-code';
import { Email, Utility, Regex } from './__api__';
import { QRCode } from 'services/qr-code';

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
type InputC = {
    contact: string;
    contactEmail: string;
    companyId: string;
    workCategoryId: string;
};

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let ptwId: string = await pinCode.next();

            let verify: string = '';
            while (true) {
                verify = Utility.RandomText(20, { symbol: false });

                let work: WorkPermit = await new Parse.Query(WorkPermit)
                    .equalTo('verify', verify)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!work) {
                    break;
                }
            }

            let company: Companies = await new Parse.Query(Companies)
                .equalTo('objectId', _input.companyId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!company) {
                throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
            }

            let workCategory: Purposes = await new Parse.Query(Purposes)
                .equalTo('objectId', _input.workCategoryId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!workCategory) {
                throw Errors.throw(Errors.CustomBadRequest, ['work category not found']);
            }

            let host: string = Config.core.publicExternalIP;
            let url: string = `${host}/contractorRegistration?id=${verify}`;

            let title: string = 'Contractor Registration';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${_input.contact},</h3>
                    <h4>One Raffles Link has send you a Pre-Registration Link (PTW #${ptwId}) for Plumbing works at ${company.getValue('name')}.</h4>
                    <h4>Please compete your registration by clicking on this link
                        <a href="${url}">${host}</a>
                    </h4>
                </div>`;

            await SendEmail(title, content, [_input.contactEmail]);

            let work: WorkPermit = new WorkPermit();

            work.setValue('creator', data.user);
            work.setValue('status', EWorkPermitStatus.new);
            work.setValue('ptwId', ptwId);
            work.setValue('verify', verify);
            work.setValue('contact', _input.contact);
            work.setValue('contactEmail', _input.contactEmail);
            work.setValue('company', company);
            work.setValue('workCategory', workCategory);

            await work.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action Read
 */
interface IInputPaging {
    page?: number;
    pageSize?: number;
}
type InputR = {
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
    contractorCompanyName?: string;
    workContact?: string;
    personName?: string;
};

interface IOutputPaging {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}
type OutputR = {
    paging: IOutputPaging;
    results: {
        objectId: string;
        status: string;
        contact: string;
        contactEmail: string;
        pdpaAccepted: boolean;
        ptwId: string;
        company: {
            objectId: string;
            name: string;
        };
        workCategory: {
            objectId: string;
            name: string;
        };
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
        attachments: { name: string; type: string; url: string }[];
        termsAccepted: boolean;
        persons: IWorkPermitPerson[];
        accessGroups: IWorkPermitAccessGroup[];
        qrcode: string;
    }[];
};

action.get(
    {
        inputType: 'InputR',
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

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
                query.equalTo('contactEmail', _input.contactEmail);
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
                query.equalTo('workPremisesUnit', _input.workPremisesUnit);
            }
            if (_input.contractorCompanyName) {
                query.equalTo('contractorCompanyName', _input.contractorCompanyName);
            }
            if (_input.workContact) {
                query.equalTo('workContact', _input.workContact);
            }
            if (_input.personName) {
                query.containedIn('personNames', [_input.personName]);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let works: WorkPermit[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['company', 'workCategory'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let qrcode: QRCode = new QRCode();

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: await Promise.all(
                    works.map(async (value, index, array) => {
                        return {
                            objectId: value.id,
                            status: EWorkPermitStatus[value.getValue('status')],
                            contact: value.getValue('contact'),
                            contactEmail: value.getValue('contactEmail'),
                            pdpaAccepted: value.getValue('pdpaAccepted'),
                            ptwId: value.getValue('ptwId'),
                            company: {
                                objectId: value.getValue('company').id,
                                name: value.getValue('company').getValue('name'),
                            },
                            workCategory: {
                                objectId: value.getValue('workCategory').id,
                                name: value.getValue('workCategory').getValue('name'),
                            },
                            applicantName: value.getValue('applicantName'),
                            contractorCompanyName: value.getValue('contractorCompanyName'),
                            contractorCompanyAddress: value.getValue('contractorCompanyAddress'),
                            contractorCompanyEmail: value.getValue('contractorCompanyEmail'),
                            contractorCompanyContactPhone: value.getValue('contractorCompanyContactPhone'),
                            contractorCompanyFax: value.getValue('contractorCompanyFax'),
                            workPremisesUnit: value.getValue('workPremisesUnit'),
                            workLocation: value.getValue('workLocation'),
                            workDescription: value.getValue('workDescription'),
                            workType1: value.getValue('workType1'),
                            workType2: value.getValue('workType2'),
                            workType3: value.getValue('workType3'),
                            workType4: value.getValue('workType4'),
                            workType5: value.getValue('workType5'),
                            workType6: value.getValue('workType6'),
                            workType7: value.getValue('workType7'),
                            workType8: value.getValue('workType8'),
                            workStartDate: value.getValue('workStartDate'),
                            workStartTime: value.getValue('workStartTime'),
                            workEndDate: value.getValue('workEndDate'),
                            workEndTime: value.getValue('workEndTime'),
                            workContact: value.getValue('workContact'),
                            workContactPhone: value.getValue('workContactPhone'),
                            checklist1: value.getValue('checklist1'),
                            checklistRemark1: value.getValue('checklistRemark1'),
                            checklist2: value.getValue('checklist2'),
                            checklistRemark2: value.getValue('checklistRemark2'),
                            checklist3: value.getValue('checklist3'),
                            checklistRemark3: value.getValue('checklistRemark3'),
                            checklist4: value.getValue('checklist4'),
                            checklistRemark4: value.getValue('checklistRemark4'),
                            checklist5: value.getValue('checklist5'),
                            checklistRemark5: value.getValue('checklistRemark5'),
                            checklist6: value.getValue('checklist6'),
                            checklistRemark6: value.getValue('checklistRemark6'),
                            checklist7: value.getValue('checklist7'),
                            checklistRemark7: value.getValue('checklistRemark7'),
                            checklist8: value.getValue('checklist8'),
                            checklist9: value.getValue('checklist9'),
                            attachments: (value.getValue('attachments') || []).map((value1, index1, array1) => {
                                let url: string = FileHelper.getURL(value1, data);
                                return {
                                    name: value1.name(),
                                    type: url.substring(url.lastIndexOf('.') + 1, url.length),
                                    url: url,
                                };
                            }),
                            termsAccepted: value.getValue('termsAccepted'),
                            persons: value.getValue('persons'),
                            accessGroups: value.getValue('accessGroups'),
                            qrcode: FileHelper.getURL(await qrcode.make(`PTW # ${value.getValue('ptwId')}`), data),
                        };
                    }),
                ),
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
    objectId: string;
    companyId?: string;
    workCategoryId?: string;
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
                .equalTo('objectId', _input.objectId)
                .include('invitation')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }
            switch (work.getValue('status')) {
                case EWorkPermitStatus.new:
                    throw Errors.throw(Errors.CustomBadRequest, ['can not modify when now']);
                case EWorkPermitStatus.reject:
                    throw Errors.throw(Errors.CustomBadRequest, ['can not modify when reject']);
                case EWorkPermitStatus.approve:
                    let now: Date = new Date();
                    let endDate: Date = work.getValue('workEndDate');
                    let endTime: Date = work.getValue('workEndTime');
                    endDate.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), endTime.getMilliseconds());

                    if (now.getTime() > endDate.getTime()) {
                        throw Errors.throw(Errors.CustomBadRequest, ['can not modify when approve']);
                    }
            }

            if (_input.companyId) {
                let company: Companies = await new Parse.Query(Companies)
                    .equalTo('objectId', _input.companyId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!company) {
                    throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                }

                work.setValue('company', company);

                delete _input.companyId;
            }
            if (_input.workCategoryId) {
                let workCategory: Purposes = await new Parse.Query(Purposes)
                    .equalTo('objectId', _input.workCategoryId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!workCategory) {
                    throw Errors.throw(Errors.CustomBadRequest, ['work category not found']);
                }

                work.setValue('workCategory', workCategory);

                delete _input.workCategoryId;
            }

            if (_input.workStartDate) {
                _input.workStartDate.setHours(0, 0, 0, 0);
            }
            if (_input.workStartTime) {
                _input.workStartTime.setFullYear(2000, 0, 1);
            }
            if (_input.workEndDate) {
                _input.workEndDate.setHours(0, 0, 0, 0);
            }
            if (_input.workEndTime) {
                _input.workEndTime.setFullYear(2000, 0, 1);
            }
            if (_input.persons) {
                let personNames: string[] = _input.persons.map((value, index, array) => {
                    return value.name;
                });

                work.setValue('personNames', personNames);
            }

            delete _input.objectId;

            await work.save(_input, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            if (work.getValue('status') === EWorkPermitStatus.approve) {
                let company = work.getValue('company');

                let visitors: any = work.getValue('persons');

                let purpose = work.getValue('workCategory');

                let startDate: Date = work.getValue('workStartDate');
                let startTime: Date = work.getValue('workStartTime');
                let endDate: Date = work.getValue('workEndDate');
                let endTime: Date = work.getValue('workEndTime');

                let dates: IFlow1InvitationDateUnit[] = [];
                for (let i: number = startDate.getTime(); i <= endDate.getTime(); i += 86400000) {
                    let date: Date = new Date(i);

                    let start: Date = new Date(new Date(date).setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds(), startTime.getMilliseconds()));
                    let end: Date = new Date(new Date(date).setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), endTime.getMilliseconds()));

                    dates.push({
                        start: start,
                        end: end,
                    });
                }

                let invitation = work.getValue('invitation');

                invitation.setValue('company', company);
                invitation.setValue('visitors', visitors);
                invitation.setValue('purpose', purpose);
                invitation.setValue('dates', dates as any);
                invitation.setValue('accessGroups', work.getValue('accessGroups'));

                await invitation.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = {
    objectId: string;
};

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let work: WorkPermit = await new Parse.Query(WorkPermit)
                .equalTo('objectId', _input.objectId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            await work.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Send email
 * @param title
 * @param content
 * @param tos
 */
export async function SendEmail(title: string, content: string, tos: string[], ccs: string[] = []): Promise<void> {
    try {
        if (!Config.smtp.enable) {
            throw Errors.throw(Errors.Custom, ['smtp service not enable']);
        }
        let email: Email = new Email();
        email.config = {
            host: Config.smtp.host,
            port: Config.smtp.port,
            email: Config.smtp.email,
            password: Config.smtp.password,
        };

        try {
            email.Initialization();
        } catch (e) {
            throw Errors.throw(Errors.Custom, [e]);
        }

        tos.forEach((value, index, array) => {
            if (!Regex.IsEmail(value)) {
                throw Errors.throw(Errors.Custom, [`can not send email to ${value}`]);
            }
        });

        ccs.forEach((value, index, array) => {
            if (!Regex.IsEmail(value)) {
                throw Errors.throw(Errors.Custom, [`can not cc email to ${value}`]);
            }
        });

        let result = await email.Send(title, content, {
            tos: tos,
            ccs: ccs,
        });
    } catch (e) {
        throw e;
    }
}
