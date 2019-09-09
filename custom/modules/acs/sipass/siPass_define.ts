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
    UserName?: string;
    Password?: string;
}

export interface ICardTemplate {
    name?: string;
    id?: string;
    pageStyle?: string;
    frontPage?: string;
    backPage?: string;
}

export interface ICardholderCredential {
    Active?: boolean;
    CardNumber?: string;
    EndDate?: string;
    Pin?: number;
    RevisionNumber?: number;
    PinErrorDisable?: boolean;
    ProfileId?: number;
    ProfileName?: string;
    StartDate?: string;
    FacilityCode?: number;
    CardTechnologyCode?: number;
    PinMode?: number;
    PinDigit?: number;
}

export interface ICardholderAccessRule {
    ObjectToken?: string;
    ObjectName?: string;
    RuleToken?: string;
    RuleType?: EAccessRules;
    RimeScheduleToken?: string;
    StartDate?: string;
    EndDate?: string;
    ArmingRightsId?: EArmingRights;
    ControlModeId?: EControlMode;
    IsFavourite?: boolean;
    Side?: number;
}

export interface ICardholderAttributes {
    Accessibility?: boolean;
    ApbExclusion?: boolean;
    ApbReEntryExclusion?: boolean;
    Isolate?: boolean;
    SelfAuthorize?: boolean;
    Supervisor?: boolean;
    Visitor?: boolean;
    Void?: boolean;
    RestrictedVisitor?: boolean;
}

export interface ICardholderVehicle {
    CarColor?: string,
    CarModelNumber?: string,
    CarRegistrationNumber?: string
}

export interface ICardholderWorkGroupAccessRule {
    WorkGroupId?: number,
    WorkGroupName?: string,
    AccessPolicyRules?: ICardholderAccessRule[]
}

export interface ICustomFields {
    FiledName?: string,
    FieldValue?: string,
    Behaviour?: string
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
    Email?: string,
    MobileNumber?: string,
    MobileServiceProvider?: string,
    MobileServiceProviderId?: string,
    PagerNumber?: string,
    PagerServiceProvider?: string,
    PagerServiceProviderId?: string,
    PhoneNumber?: string,
    UuseEmailforMessageForward?: boolean
}


export interface ICardholderPersonal {
    Address?: string,
    ContactDetails?: ICardholderContactDetails,
    DateOfBirth?: string,
    PayrollNumber?: string,
    Title?: string,
    UserDetails?: ICardholderUserDetails
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
    VisitedEmployeeFirstName?: string,
    VisitedEmployeeId?: number,
    VisitedEmployeeLastName?: string,
    VisitorCardIssueTime?: string,
    VisitorCardReturnTime?: string,
    VisitorCardStatus?: number,
    VisitorCustomValues?: IVisitorCustomValues,
    IsDeleteCardFromList?: boolean
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
    objectId?:string;
    Attributes?: ICardholderAttributes,
    Credentials?: ICardholderCredential[],
    BaseCardNumber?: string,
    AccessRules?: ICardholderAccessRule[],
    EmployeeNumber?: string,
    EndDate?: string,
    FirstName?: string,
    GeneralInformation?: string,
    LastName?: string,
    EmployeeName?: string,
    PersonalDetails?: ICardholderPersonal,
    PrimaryWorkgroupId?: number,
    ApbWorkgroupId?: number,
    PrimaryWorkgroupName?: string,
    NonPartitionWorkGroups?: IAccessGroupObject[],
    SmartCardProfileId ?: string,
    SmartCardProfileName ?: string,
    StartDate?: string,
    Status?: ECardholderStatus,
    Token?: string,
    TraceDetails?: ICardholderTrace,
    Vehicle1?: ICardholderVehicle,
    Vehicle2?: ICardholderVehicle,
    Potrait?: string,
    PrimaryWorkGroupAccessRule?: ICardholderAccessRule[],
    NonPartitionWorkgroupAccessRules?: ICardholderWorkGroupAccessRule[],
    VisitorDetails?: IVisitor,
    CustomFields?: ICustomFields[],
    FingerPrints?: IBiometricStatus[],
    CardholderPortrait?: string,
    IsImageChanged?: boolean,
    IsSignatureChanged?: boolean,
    CardholderSignature?: string,
    ElevatorRole?: EElevatorRole,
    ElevatorLight?: number,
    ElevatorLanguage?: number,
    EtartDateWithoutTime?: string,
    EndDateWithoutTime?: string,
    LastUpdatedDateTime?: string,
    Reference?: number,
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
    //sessionId: string;
}
export interface IQueryTimeRange {
    begin:Date;
    end:Date;
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