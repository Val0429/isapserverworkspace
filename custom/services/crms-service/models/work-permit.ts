import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Companies } from './companies';

/**
 *
 */
export interface IWorkPermitPerson {
    name: string;
    phone: string;
    nric: string;
    occupation: string;
    unitNo: string;
    vehicle: string;
    companyName: string;
    shift: string;
}

/**
 *
 */
export interface IWorkPermitAccessGroup {
    doorId: string;
    doorName: string;
}

/**
 *
 */
export enum EWorkPermitStatus {
    new = 1,
    pendding,
    approve,
    reject,
}

/**
 *
 */
export interface IWorkPermit {
    /**
     * Creator
     */
    creator: Parse.User;

    /**
     * Status
     */
    status: EWorkPermitStatus;

    /**
     * Verify
     */
    verify: string;

    /**
     * Contact
     */
    contact: string;
    contactEmail: string;

    /**
     * Step 1
     */
    pdpaAccepted: boolean;

    /**
     * Step 2
     */
    ptwId: string;
    company: Companies;
    workCategory: string;

    applicantName: string;
    contractorCompanyName: string;
    contractorCompanyAddress: string;
    contractorCompanyEmail: string;
    contractorCompanyContactPhone: string;
    contractorCompanyFax: string;

    /**
     * Step 3
     */
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

    /**
     * Step 4
     */
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

    /**
     * Step 5
     */
    attachments: Parse.File[];

    /**
     * Step 6
     */
    termsAccepted: boolean;

    /**
     * Step 7
     */
    persons: IWorkPermitPerson[];
    personNames: string[];

    /**
     * Step 8
     */
    accessGroups: IWorkPermitAccessGroup[];
}

@registerSubclass()
export class WorkPermit extends ParseObject<IWorkPermit> {}
