import { Int32 } from "bson";
import { ShorthandPropertyAssignment, StringLiteral } from "ts-simple-ast";
import { IConfiguration } from "helpers/config/config-helper";

//------------------enum data----------------------------//

export enum EAccessRules {
    Unknown = 0,
    AccessPointGroup,
    AccessPoint,
    AccessLevel,
    AccessGroup,
    ExternalPointGroup,
    ExternalSystemPoint,
    FloorPointGroup,
    FloorPoint,
    IntrusionAreaPointGroup,
    IntrusionAreaPoint,
    OfflineAccessGroup,
    VenueBooking
}

export enum EControlMode {
    Unknown = 0,
    SecureAndUnsecure,
    SecureOnly,
    UnsecureOnly
}

export enum EArmingRights {
    EntireArea = 0,
    Room1,
    Room2,
    Room3,
    Room4,
    Room5,
    Room6,
    Room7,
    Room8
}

export enum ECardTemplate {
    All = 0,
    SiPassTemplate,
    NexusTemplate,
}

export enum EWorkGroupType {
    Department = 0,
    Contractor,
    Other,
    Visitor
}

export enum ECardholderStatus {
    None = 0,
    Vaild = 61,
    Void = 62,
    Expired = 63,
    BeforeStartDate = 64,
    WorkGroupVoid = 65
}

export enum EElevatorRole {
    None = 0,
    Caretaker,
    Technician
}

//------------------parameter interface----------------------------//

export interface ICardholderUserDetails {
    userName?: string;
    password?: string;
}

export interface ICardTemplate {
    name?: string;
    id?: string;
    pageStyle?: string;
    frontPage?: string;
    backPage?: string;
}

export interface ICardholderCredential {
    active?: boolean;
    cardNumber?: string;
    endDate?: string;
    pin?: number;
    revisionNumber?: number;
    pinErrorDisable?: boolean;
    profileId?: number;
    profileName?: string;
    startDate?: string;
    facilityCode?: number;
    cardTechnologyCode?: number;
    pinMode?: number;
    pinDigit?: number;
}

export interface ICardholderAccessRule {
    objectToken?: string;
    objectName?: string;
    ruleToken?: string;
    ruleType?: EAccessRules;
    timeScheduleToken?: string;
    startDate?: string;
    endDate?: string;
    armingRightsId?: EArmingRights;
    controlModeId?: EControlMode;
    isFavourite?: boolean;
    side?: number;
}

export interface ICardholderAttributes {
    accessibility?: boolean;
    apbExclusion?: boolean;
    apbReEntryExclusion?: boolean;
    isolate?: boolean;
    selfAuthorize?: boolean;
    supervisor?: boolean;
    visitor?: boolean;
    void?: boolean;
    restrictedVisitor?: boolean;
}

export interface ICardholderVehicle {
    carColor?: string,
    carModelNumber?: string,
    carRegistrationNumber?: string
}

export interface ICardholderWorkGroupAccessRule {
    workGroupId?: number,
    workGroupName?: string,
    accessPolicyRules?: ICardholderAccessRule[]
}

export interface ICustomFields {
    filedName?: string,
    fieldValue?: object,
    behaviour?: string
}

export interface ICardholderTrace {
    cardLastUsed?: string,
    cardNumberLastUsed?: string,
    lastApbLocation?: string,
    pointName?: string,
    traceCard?: boolean
}

export interface IBiometricStatus {
    biometricId?: number,
    binaryData?: string,
    credentialProfileId?: number,
    credentialProfile?: string,
    encoded?: string,
    saved?: string,
    fingerIndex?: string
}

export interface ICardholderContactDetails {
    email?: string,
    mobileNumber?: string,
    mobileServiceProvider?: string,
    mobileServiceProviderId?: string,
    pagerNumber?: string,
    pagerServiceProvider?: string,
    pagerServiceProviderId?: string,
    phoneNumber?: string,
    useEmailforMessageForward?: boolean
}


export interface ICardholderPersonal {
    address?: string,
    contactDetails?: ICardholderContactDetails,
    dateOfBirth?: string,
    payrollNumber?: string,
    title?: string,
    userDetails?: ICardholderUserDetails
}

export interface IVisitorCustomValues {
    company?: string,
    profile?: string,
    reason?: string,
    license?: string,
    email?: string,
    restrictedUser?: string,
    companyCode?: string,
    durationEntry?: string,
    durationEquipment?: string,
    durationEntrainmentTools?: string,
    validityApprentice?: string,
    validityPeriodIdCard?: string,
    entryMonSat?: boolean,
    entryInclSun?: boolean,
    itEquipment?: boolean,
    entrainmentTools?: boolean,
    topManagement?: boolean,
    apprentice?: boolean
}

export interface IVisitor {
    visitedEmployeeFirstName?: string,
    visitedEmployeeId?: number,
    visitedEmployeeLastName?: string,
    visitorCardIssueTime?: string,
    visitorCardReturnTime?: string,
    visitorCardStatus?: number,
    visitorCustomValues?: IVisitorCustomValues,
    isDeleteCardFromList?: boolean
}

export interface ILink {
    curie?: ICuriesLink,
    rel?: string,
    href?: string,
    title?: string,
    type?: string,
    deprecation?: string,
    name?: string,
    profile?: string,
    hrefLang?: string,
    isTemplated?: boolean
}

export interface ICuriesLink {
    name?: string,
    href?: string
}


export interface IEmbeddedResource {
    isSourceAnArray?: boolean,
    resources?: IIResource[]
}

export interface IIResource {
    _links?: ILink[]
}
//------------------object interface----------------------------//

export interface IAccessGroupObject {
    token?: string;
    name?: string;
    accessLevels?: IAccessLevelObject[];
}

export interface IAccessLevelObject {
    name?: string;
    token?: string;
    accessRule?: ICardholderAccessRule[];
    timeScheduleToken?: string;
    isFavourite?: boolean;
}


export interface IWorkGroupObject {
    name?: string;
    token?: number;
    type?: EWorkGroupType;
    accessPolicyRules?: ICardholderAccessRule[];
    clearCardNo?: boolean;
    disableAccessControl?: boolean;
    partition?: boolean;
    primaryContactAddress?: string,
    primaryContactFax?: string,
    primaryContactMobile?: string,
    primaryContactName?: string,
    primaryContactPhone?: string,
    primaryContactTitle?: string,
    secondaryContactAddress?: string,
    secondaryContactFax?: string,
    secondaryContactMobile?: string,
    secondaryContactName?: string,
    secondaryContactPhone?: string,
    secondaryContactTitle?: string,
    void?: boolean,
    //smartCardProfileId?: string,
    cardRange?: string

}

export interface ICardholderObject {
    attributes?: ICardholderAttributes,
    credentials?: ICardholderCredential[],
    baseCardNumber?: string,
    accessRules?: ICardholderAccessRule[],
    employeeNumber?: string,
    endDate?: string,
    firstName?: string,
    generalInformation?: string,
    lastName?: string,
    employeeName?: string,
    personalDetails?: ICardholderPersonal,
    primaryWorkgroupId?: number,
    apbWorkgroupId?: number,
    primaryWorkgroupName?: string,
    nonPartitionWorkGroups?: IAccessGroupObject[],
    smartCardProfileId ?: string,
    smartCardProfileName ?: string,
    startDate?: string,
    status?: ECardholderStatus,
    token?: string,
    traceDetails?: ICardholderTrace,
    vehicle1?: ICardholderVehicle,
    vehicle2?: ICardholderVehicle,
    potrait?: string,
    primaryWorkGroupAccessRule?: ICardholderAccessRule[],
    nonPartitionWorkgroupAccessRules?: ICardholderWorkGroupAccessRule[],
    visitorDetails?: IVisitor,
    customFields?: ICustomFields[],
    fingerPrints?: IBiometricStatus[],
    cardholderPortrait?: string,
    isImageChanged?: boolean,
    isSignatureChanged?: boolean,
    cardholderSignature?: string,
    elevatorRole?: EElevatorRole,
    elevatorLight?: number,
    elevatorLanguage?: number,
    startDateWithoutTime?: string,
    endDateWithoutTime?: string,
    lastUpdatedDateTime?: string,
    reference?: number,
    _links?: ILink[],
    _embedded?: IEmbeddedResource[]
}



//----------------------------------------------//

export interface IConnectionInfo {
    userName: string;
    password: string;
    uniqueId: string;
    domain: string;
    port: string;
    sessionId: string;
}

export interface IQueryTimeRange {
    date: string;
    beginHour: string; //   03
    beginMin: string;  //   13
    beginSec: string;  //   23
    endHour: string;
    endMin: string;
    endSec: string;    
}

export interface IDbConnectionInfo {
    server :string;
    port : number;
    user :string;
    password: string;
    database: string;
    connectionTimeout: number;
}

export class SiPassHrApiGlobalParameter {

    public userName: string;
    public password: string;
    public uniqueId: string;
    public domain: string;
    public port: string;
    //public sessionId: string;


    constructor(data: IConnectionInfo) {

        this.userName = data.userName;
        this.password = data.password;
        this.uniqueId = data.uniqueId;
        this.domain = data.domain;
        this.port = data.port;
        //this.sessionId = data.sessionId;
    }

}

export class SiPassMsApiGlobalParameter {

    public userName: string;
    public password: string;
    public uniqueId: string;
    public domain: string;
    public port: string;
    //public sessionId: string;


    constructor(data: IConnectionInfo) {

        this.userName = data.userName;
        this.password = data.password;
        this.uniqueId = data.uniqueId;
        this.domain = data.domain;
        this.port = data.port;
        //this.sessionId = data.sessionId;
    }
}


export class SiPassDbConnectInfo{
    public server :string;
    public port : number;
    public user :string;
    public password: string;
    public database: string;
    public connectionTimeout: number;

    constructor(data: IDbConnectionInfo) {

        this.server = data.server;
        this.port = data.port;
        this.user = data.user;
        this.password = data.password;
        this.database = data.database;
        this.connectionTimeout = data.connectionTimeout;
    }
}