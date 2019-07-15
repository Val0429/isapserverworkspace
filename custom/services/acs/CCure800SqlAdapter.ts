import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

import * as msSQL from 'mssql';

export class CCure800SqlAdapter {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient = null;

    constructor() {
        var me = this;

        // this.waitTimer = setTimeout(() => {
        //     me.doHumanResourcesSync();
        // }, 1000 * this.startDelayTime);
    }

    async connect(config) {
        Log.Info(`${this.constructor.name}`, `connect`);

        try {
            this.sqlClient = new msSQL.ConnectionPool(config);
            await this.sqlClient.connect();
        }
        catch (ex) {
            Log.Info(`${this.constructor.name}`, ex);
        }
    }

    async disconnect() {
        Log.Info(`${this.constructor.name}`, `disconnect`);

        try {
            await this.sqlClient.close();
        }
        catch (ex) {
            Log.Info(`${this.constructor.name}`, ex);
        }
    }

    async writeMember(data) {
        Log.Info(`${this.constructor.name}`, `writeMember ${JSON.stringify(data).substring(0, 100)}`);

        let rules = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
        let access = data["AccessRules"];

        for (let i = 0; i < access.length; i++) {
            rules[i] = access[i]["objectName"];
        }

        let CustomDateControl3__CF1 = "";
        let CustomDateControl3__CF2 = "";
        let CustomDateControl3__CF3 = "";
        let CustomDateControl3__CF4 = "";
        let CustomDateControl3__CF5 = "";

        let CustomDateControl3__CF6 = "";
        let CustomDateControl3__CF7 = "";
        let CustomDateControl3__CF8 = "";

        let CustomDateControl3__CF9 = "";
        let CustomDateControl3__CF10 = "";
        let CustomDateControl3__CF11 = "";
        let CustomDateControl3__CF12 = "";
        let CustomDateControl4__CF = "";
        let CustomDropdownControl1__CF = "";
        let CustomDropdownControl2__CF1 = "";
        let CustomDropdownControl2__CF2 = "";
        let CustomDropdownControl3__CF1 = "";
        let CustomDropdownControl3__CF2 = "";
        let CustomDropdownControl3__CF3 = "";
        let CustomDropdownControl3__CF4 = "";
        let CustomDropdownControl3__CF5 = "";
        let CustomDropdownControl3__CF6 = "";
        let CustomTextBoxControl1__CF = "";
        let CustomTextBoxControl2__CF = "";
        let CustomTextBoxControl3__CF = "";
        let CustomTextBoxControl5__CF1 = "";
        let CustomTextBoxControl5__CF2 = "";
        let CustomTextBoxControl5__CF3 = "";
        let CustomTextBoxControl5__CF4 = "";
        let CustomTextBoxControl5__CF5 = "";
        let CustomTextBoxControl5__CF6 = "";
        let CustomTextBoxControl5__CF7 = "";
        let CustomTextBoxControl5__CF8 = "";
        let CustomTextBoxControl5__CF9 = "";
        let CustomTextBoxControl5__CF10 = "";
        let CustomTextBoxControl6__CF = "";
        let CustomTextBoxControl7__CF1 = "";
        let CustomTextBoxControl7__CF2 = "";
        let CustomTextBoxControl7__CF3 = "";
        let CustomTextBoxControl7__CF4 = "";
        let CustomTextBoxControl7__CF5 = "";
        let CustomTextBoxControl7__CF6 = "";
        let CustomTextBoxControl7__CF7 = "";
        let CustomTextBoxControl7__CF8 = "";
        let CustomTextBoxControl7__CF9 = "";
        let CustomTextBoxControl7__CF10 = "";
        let CustomTextBoxControl7__CF11 = "";
        let CustomTextBoxControl7__CF12 = "";

        for (let i = 0; i < data["CustomFields"]; i++) {
            const field = data["CustomFields"][i];

            switch (field["FiledName"]) {
                case "CustomDateControl3__CF": CustomDateControl3__CF1 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF": CustomDateControl3__CF2 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF": CustomDateControl3__CF3 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF": CustomDateControl3__CF4 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF": CustomDateControl3__CF5 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF": CustomDateControl3__CF6 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF7 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF8 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF9 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF10 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF11 = field["FieldValue"];    break ;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF12 = field["FieldValue"];    break ;
                case "CustomDateControl4__CF": CustomDateControl4__CF = field["FieldValue"];    break ;
                case "CustomDropdownControl1__CF": CustomDropdownControl1__CF = field["FieldValue"];    break ;
                case "CustomDropdownControl2__CF": CustomDropdownControl2__CF1 = field["FieldValue"];    break ;
                case "CustomDropdownControl2__CF_CF": CustomDropdownControl2__CF2 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF": CustomDropdownControl3__CF1 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF_CF": CustomDropdownControl3__CF2 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF_CF_CF": CustomDropdownControl3__CF3 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF_CF_CF_CF": CustomDropdownControl3__CF4 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF_CF_CF_CF_CF": CustomDropdownControl3__CF5 = field["FieldValue"];    break ;
                case "CustomDropdownControl3__CF_CF_CF_CF_CF_CF": CustomDropdownControl3__CF6 = field["FieldValue"];    break ;
                case "CustomTextBoxControl1__CF": CustomTextBoxControl1__CF = field["FieldValue"];    break ;
                case "CustomTextBoxControl2__CF": CustomTextBoxControl2__CF = field["FieldValue"];    break ;
                case "CustomTextBoxControl3__CF": CustomTextBoxControl3__CF = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF": CustomTextBoxControl5__CF1 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF": CustomTextBoxControl5__CF2 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF": CustomTextBoxControl5__CF3 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF": CustomTextBoxControl5__CF4 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF": CustomTextBoxControl5__CF5 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF6 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl5__CF7 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl5__CF8 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl5__CF9 = field["FieldValue"];    break ;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl5__CF10 = field["FieldValue"];    break ;
                case "CustomTextBoxControl6__CF":CustomTextBoxControl6__CF = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF":CustomTextBoxControl7__CF1 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF":CustomTextBoxControl7__CF2 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF":CustomTextBoxControl7__CF3 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF":CustomTextBoxControl7__CF4 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF":CustomTextBoxControl7__CF5 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF6 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF7 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF8 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF9 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF10 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF11 = field["FieldValue"];    break ;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF":CustomTextBoxControl7__CF12 = field["FieldValue"];    break ;
            }
        }


        let res = await this.sqlClient.request()
            .input('ApbWorkgroupId', msSQL.Char(50), data["ApbWorkgroupId"])
            .input('Attributes', msSQL.Char(50), JSON.stringify(data["Attributes"]))
            .input('Cred_CardNumber', msSQL.Char(50), data["Credentials"]["CardNumber"])
            .input('Cred_EndDate', msSQL.Char(50), data["Credentials"]["EndDate"])
            .input('Cred_Pin', msSQL.Char(50), data["Credentials"]["Pin"])
            .input('Cred_ProfileId', msSQL.Char(50), data["Credentials"]["ProfileId"])
            .input('Cred_ProfileName', msSQL.NVarChar(50), data["Credentials"]["ProfileName"])
            .input('Cred_StartDate', msSQL.Char(50), data["Credentials"]["StartDate"])
            .input('Cred_FacilityCode', msSQL.Char(50), data["Credentials"]["FacilityCode"])
            .input('Cred_CardTechnologyCode', msSQL.Char(50), data["Credentials"]["CardTechnologyCode"])
            .input('Cred_PinMode', msSQL.Char(50), data["Credentials"]["PinMode"])
            .input('Cred_PinDigit', msSQL.Char(50), data["Credentials"]["PinDigit"])

            .input('EmployeeNumber', msSQL.Char(50), data["EmployeeNumber"])
            .input('EndDate', msSQL.Char(50), data["EndDate"])
            .input('FirstName', msSQL.Char(50), data["FirstName"])
            .input('GeneralInformation', msSQL.Char(50), data["GeneralInformation"])
            .input('LastName', msSQL.NVarChar(50), data["LastName"])
            .input('NonPartitionWorkGroups', msSQL.Char(50), data["NonPartitionWorkGroups"])
            .input('PhoneNumber', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["MobileNumber"])
            .input('FinalDate', msSQL.Char(50), msSQL.Char(50), data["EndDate"])
            .input('IniDate', msSQL.Char(50), data["StartDate"])
            .input('Pin', msSQL.Char(50), data["Credentials"]["Pin"])

            .input('PD_Address', msSQL.Char(50), data["PersonalDetails"]["Address"])
            .input('PD_CD_Email', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["Email"])
            .input('PD_CD_MobileNumber', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["MobileNumber"])
            .input('PD_CD_MobileServiceProviderId', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["MobileServiceProviderId"])
            .input('PD_CD_PagerNumber', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["PagerNumber"])
            .input('PD_CD_PagerServiceProviderId', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["PagerServiceProviderId"])
            .input('PD_CD_PhoneNumber', msSQL.Char(50), data["PersonalDetails"]["ContactDetails"]["PhoneNumber"])
            .input('PD_DateOfBirth', msSQL.Char(50), data["PersonalDetails"]["DateOfBirth"])
            .input('PD_PayrollNumber', msSQL.Char(50), data["PersonalDetails"]["PayrollNumber"])
            .input('PD_Title', msSQL.Char(50), data["PersonalDetails"]["Title"])
            .input('PD_UD_UserName', msSQL.Char(50), data["PersonalDetails"]["UserDetails"]["UserName"])
            .input('PD_UD_Password', msSQL.Char(50), data["PersonalDetails"]["UserDetails"]["Password"])

            .input('Potrait', msSQL.Char(50), data["Potrait"])
            .input('PrimaryWorkgroupId', msSQL.Char(50), data["PrimaryWorkgroupId"])
            .input('PrimaryWorkgroupName', msSQL.Char(50), data["PrimaryWorkgroupName"])
            .input('SmartCardProfileId', msSQL.Char(50), data["SmartCardProfileId"])
            .input('StartDate', msSQL.Char(50), data["StartDate"])
            .input('Status', msSQL.Char(50), data["Status"])
            .input('Token', msSQL.Char(50), data["Token"])
            .input('TraceDetails', msSQL.Char(50), JSON.stringify(data["TraceDetails"]))
            .input('Vehicle1', msSQL.Char(50), JSON.stringify(data["Vehicle1"]))
            .input('Vehicle2', msSQL.Char(50), JSON.stringify(data["Vehicle2"]))
            .input('VisitorDetails_VisitorCardStatus', msSQL.Char(50), data["VisitorDetails"]["VisitorCardStatus"])
            .input('VisitorDetails_VisitorCustomValues', msSQL.Char(50), JSON.stringify(data["VisitorDetails"]["VisitorCustomValues"]))

            .input('CustomDateControl3__CF1', msSQL.Char(50),CustomDateControl3__CF1)
            .input('CustomDateControl3__CF2', msSQL.Char(50),CustomDateControl3__CF2)
            .input('CustomDateControl3__CF3', msSQL.Char(50),CustomDateControl3__CF3)
            .input('CustomDateControl3__CF4', msSQL.Char(50),CustomDateControl3__CF4)
            .input('CustomDateControl3__CF5', msSQL.Char(50),CustomDateControl3__CF5)
            .input('CustomDateControl3__CF6', msSQL.Char(50),CustomDateControl3__CF6)
            .input('CustomDateControl3__CF7', msSQL.Char(50),CustomDateControl3__CF7)
            .input('CustomDateControl3__CF8', msSQL.Char(50),CustomDateControl3__CF8)
            .input('CustomDateControl3__CF9', msSQL.Char(50),CustomDateControl3__CF9)
            .input('CustomDateControl3__CF10', msSQL.Char(50),CustomDateControl3__CF10)
            .input('CustomDateControl3__CF11', msSQL.Char(50),CustomDateControl3__CF11)
            .input('CustomDateControl3__CF12', msSQL.Char(50),CustomDateControl3__CF12)
            .input('CustomDateControl4__CF', msSQL.Char(50),CustomDateControl4__CF)
            .input('CustomDropdownControl1__CF', msSQL.Char(50),CustomDropdownControl1__CF)
            .input('CustomDropdownControl2__CF1', msSQL.Char(50),CustomDropdownControl2__CF1)
            .input('CustomDropdownControl2__CF2', msSQL.Char(50),CustomDropdownControl2__CF2)
            .input('CustomDropdownControl3__CF1', msSQL.Char(50),CustomDropdownControl3__CF1)
            .input('CustomDropdownControl3__CF2', msSQL.Char(50),CustomDropdownControl3__CF2)
            .input('CustomDropdownControl3__CF3', msSQL.Char(50),CustomDropdownControl3__CF3)
            .input('CustomDropdownControl3__CF4', msSQL.Char(50),CustomDropdownControl3__CF4)
            .input('CustomDropdownControl3__CF5', msSQL.Char(50),CustomDropdownControl3__CF5)
            .input('CustomDropdownControl3__CF6', msSQL.Char(50),CustomDropdownControl3__CF6)
            .input('CustomTextBoxControl1__CF', msSQL.Char(50),CustomTextBoxControl1__CF)
            .input('CustomTextBoxControl2__CF', msSQL.Char(50),CustomTextBoxControl2__CF)
            .input('CustomTextBoxControl3__CF', msSQL.Char(50),CustomTextBoxControl3__CF)
            .input('CustomTextBoxControl5__CF1', msSQL.Char(50),CustomTextBoxControl5__CF1)
            .input('CustomTextBoxControl5__CF2', msSQL.Char(50),CustomTextBoxControl5__CF2)
            .input('CustomTextBoxControl5__CF3', msSQL.Char(50),CustomTextBoxControl5__CF3)
            .input('CustomTextBoxControl5__CF4', msSQL.Char(50),CustomTextBoxControl5__CF4)
            .input('CustomTextBoxControl5__CF5', msSQL.Char(50),CustomTextBoxControl5__CF5)
            .input('CustomTextBoxControl5__CF6', msSQL.Char(50),CustomTextBoxControl5__CF6)
            .input('CustomTextBoxControl5__CF7', msSQL.Char(50),CustomTextBoxControl5__CF7)
            .input('CustomTextBoxControl5__CF8', msSQL.Char(50),CustomTextBoxControl5__CF8)
            .input('CustomTextBoxControl5__CF9', msSQL.Char(50),CustomTextBoxControl5__CF9)
            .input('CustomTextBoxControl5__CF10', msSQL.Char(50),CustomTextBoxControl5__CF10)
            .input('CustomTextBoxControl6__CF', msSQL.Char(50),CustomTextBoxControl6__CF)
            .input('CustomTextBoxControl7__CF1', msSQL.Char(50),CustomTextBoxControl7__CF1)
            .input('CustomTextBoxControl7__CF2', msSQL.Char(50),CustomTextBoxControl7__CF2)
            .input('CustomTextBoxControl7__CF3', msSQL.Char(50),CustomTextBoxControl7__CF3)
            .input('CustomTextBoxControl7__CF4', msSQL.Char(50),CustomTextBoxControl7__CF4)
            .input('CustomTextBoxControl7__CF5', msSQL.Char(50),CustomTextBoxControl7__CF5)
            .input('CustomTextBoxControl7__CF6', msSQL.Char(50),CustomTextBoxControl7__CF6)
            .input('CustomTextBoxControl7__CF7', msSQL.Char(50),CustomTextBoxControl7__CF7)
            .input('CustomTextBoxControl7__CF8', msSQL.Char(50),CustomTextBoxControl7__CF8)
            .input('CustomTextBoxControl7__CF9', msSQL.Char(50),CustomTextBoxControl7__CF9)
            .input('CustomTextBoxControl7__CF10', msSQL.Char(50),CustomTextBoxControl7__CF10)
            .input('CustomTextBoxControl7__CF11', msSQL.Char(50),CustomTextBoxControl7__CF11)
            .input('CustomTextBoxControl7__CF12', msSQL.Char(50),CustomTextBoxControl7__CF12)

            .input('AccessRules1', msSQL.Char(50), rules[0])
            .input('AccessRules2', msSQL.Char(50), rules[1])
            .input('AccessRules3', msSQL.Char(50), rules[2])
            .input('AccessRules4', msSQL.Char(50), rules[3])
            .input('AccessRules5', msSQL.Char(50), rules[4])
            .input('AccessRules6', msSQL.Char(50), rules[5])
            .input('AccessRules7', msSQL.Char(50), rules[6])
            .input('AccessRules8', msSQL.Char(50), rules[7])
            .input('AccessRules9', msSQL.Char(50), rules[8])
            .input('AccessRules10', msSQL.Char(50), rules[9])
            .input('AccessRules11', msSQL.Char(50), rules[10])
            .input('AccessRules12', msSQL.Char(50), rules[11])
            .input('AccessRules13', msSQL.Char(50), rules[12])
            .input('AccessRules14', msSQL.Char(50), rules[13])
            .input('AccessRules15', msSQL.Char(50), rules[14])
            .input('AccessRules16', msSQL.Char(50), rules[15])
            .input('AccessRules17', msSQL.Char(50), rules[16])
            .input('AccessRules18', msSQL.Char(50), rules[17])
            .input('AccessRules19', msSQL.Char(50), rules[18])
            .input('AccessRules20', msSQL.Char(50), rules[19])
            .input('AccessRules21', msSQL.Char(50), rules[20])
            .input('AccessRules22', msSQL.Char(50), rules[21])
            .input('AccessRules23', msSQL.Char(50), rules[22])
            .input('AccessRules24', msSQL.Char(50), rules[23])
            .input('AccessRules25', msSQL.Char(50), rules[24])
            .input('AccessRules26', msSQL.Char(50), rules[25])
            .input('AccessRules27', msSQL.Char(50), rules[26])
            .input('AccessRules28', msSQL.Char(50), rules[27])
            .input('AccessRules29', msSQL.Char(50), rules[28])
            .input('AccessRules30', msSQL.Char(50), rules[29])
            .input('AccessRules31', msSQL.Char(50), rules[30])
            .input('AccessRules32', msSQL.Char(50), rules[31])
            .input('AccessRules33', msSQL.Char(50), rules[32])
            .input('AccessRules34', msSQL.Char(50), rules[33])
            .input('AccessRules35', msSQL.Char(50), rules[34])
            .input('AccessRules36', msSQL.Char(50), rules[35])
            .input('AccessRules37', msSQL.Char(50), rules[36])
            .input('AccessRules38', msSQL.Char(50), rules[37])
            .input('AccessRules39', msSQL.Char(50), rules[38])
            .input('AccessRules40', msSQL.Char(50), rules[39])
            .query(`insert into Member([TimeStamp] ,[ApbWorkgroupId] ,[Attributes] 
                ,[Cred_CardNumber] ,[Cred_EndDate] ,[Cred_Pin] ,[Cred_ProfileId] ,[Cred_ProfileName] ,[Cred_StartDate] ,[Cred_FacilityCode]
                ,[Cred_CardTechnologyCode] ,[Cred_PinMode] ,[Cred_PinDigit]
                ,[EmployeeNumber] ,[EndDate] ,[FirstName] ,[GeneralInformation] ,[LastName] ,[NonPartitionWorkGroups] 
                ,[PD_Address] ,[PD_CD_Email] ,[PD_CD_MobileNumber] ,[PD_CD_MobileServiceProviderId]
                ,[PD_CD_PagerNumber] ,[PD_CD_PagerServiceProviderId] ,[PD_CD_PhoneNumber] ,[PD_DateOfBirth]
                ,[PD_PayrollNumber] ,[PD_Title] ,[PD_UD_UserName] ,[PD_UD_Password]
                ,[Potrait] ,[PrimaryWorkgroupId] ,[PrimaryWorkgroupName] ,[SmartCardProfileId] ,[StartDate] ,[Status] ,[Token] ,[TraceDetails] ,[Vehicle1] ,[Vehicle2] 
                ,[VisitorDetails_VisitorCardStatus] ,[VisitorDetails_VisitorCustomValues]
                ,[PhoneNumber], [FinalDate], [IniDate], [Pin]
                ,[AccessRules1] ,[AccessRules2] ,[AccessRules3] ,[AccessRules4] ,[AccessRules5] ,[AccessRules6] ,[AccessRules7] ,[AccessRules8] ,[AccessRules9] ,[AccessRules10]
                ,[AccessRules11] ,[AccessRules12] ,[AccessRules13] ,[AccessRules14] ,[AccessRules15] ,[AccessRules16] ,[AccessRules17] ,[AccessRules18] ,[AccessRules19] ,[AccessRules20]
                ,[AccessRules21] ,[AccessRules22] ,[AccessRules23] ,[AccessRules24] ,[AccessRules25] ,[AccessRules26] ,[AccessRules27] ,[AccessRules28] ,[AccessRules29] ,[AccessRules30]
                ,[AccessRules31] ,[AccessRules32] ,[AccessRules33] ,[AccessRules34] ,[AccessRules35] ,[AccessRules36] ,[AccessRules37] ,[AccessRules38] ,[AccessRules39] ,[AccessRules40]
                ,[CustomDateControl3__CF1] ,[CustomDateControl3__CF2] ,[CustomDateControl3__CF3] ,[CustomDateControl3__CF4] ,[CustomDateControl3__CF5] ,[CustomDateControl3__CF6] 
                ,[CustomDateControl3__CF7] ,[CustomDateControl3__CF8] ,[CustomDateControl3__CF9] ,[CustomDateControl3__CF10],[CustomDateControl3__CF11],[CustomDateControl3__CF12] 
                ,[CustomDateControl4__CF] ,[CustomDropdownControl1__CF] ,[CustomDropdownControl2__CF1] ,[CustomDropdownControl2__CF2] ,[CustomDropdownControl3__CF1] ,[CustomDropdownControl3__CF2] 
                ,[CustomDropdownControl3__CF3] ,[CustomDropdownControl3__CF4] ,[CustomDropdownControl3__CF5] ,[CustomDropdownControl3__CF6] ,[CustomTextBoxControl1__CF] 
                ,[CustomTextBoxControl2__CF] ,[CustomTextBoxControl3__CF] ,[CustomTextBoxControl5__CF1] ,[CustomTextBoxControl5__CF2] ,[CustomTextBoxControl5__CF3] 
                ,[CustomTextBoxControl5__CF4] ,[CustomTextBoxControl5__CF5] ,[CustomTextBoxControl5__CF6] ,[CustomTextBoxControl5__CF7] ,[CustomTextBoxControl5__CF8] 
                ,[CustomTextBoxControl5__CF9] ,[CustomTextBoxControl5__CF10] ,[CustomTextBoxControl6__CF] ,[CustomTextBoxControl7__CF1] ,[CustomTextBoxControl7__CF2] 
                ,[CustomTextBoxControl7__CF3] ,[CustomTextBoxControl7__CF4] ,[CustomTextBoxControl7__CF5] ,[CustomTextBoxControl7__CF6] ,[CustomTextBoxControl7__CF7] 
                ,[CustomTextBoxControl7__CF8] ,[CustomTextBoxControl7__CF9] ,[CustomTextBoxControl7__CF10],[CustomTextBoxControl7__CF11],[CustomTextBoxControl7__CF12])
                values (
                    getdate(), @ApbWorkgroupId ,@Attributes 
                    ,@Cred_CardNumber ,@Cred_EndDate ,@Cred_Pin ,@Cred_ProfileId ,@Cred_ProfileName ,@Cred_StartDate ,@Cred_FacilityCode
                    ,@Cred_CardTechnologyCode ,@Cred_PinMode ,@Cred_PinDigit
                    ,@EmployeeNumber ,@EndDate ,@FirstName ,@GeneralInformation ,@LastName ,@NonPartitionWorkGroups 
                    ,@PD_Address ,@PD_CD_Email ,@PD_CD_MobileNumber ,@PD_CD_MobileServiceProviderId
                    ,@PD_CD_PagerNumber ,@PD_CD_PagerServiceProviderId ,@PD_CD_PhoneNumber ,@PD_DateOfBirth
                    ,@PD_PayrollNumber ,@PD_Title ,@PD_UD_UserName ,@PD_UD_Password
                    ,@Potrait ,@PrimaryWorkgroupId ,@PrimaryWorkgroupName ,@SmartCardProfileId ,@StartDate ,@Status ,@Token ,@TraceDetails ,@Vehicle1 ,@Vehicle2 
                    ,@VisitorDetails_VisitorCardStatus ,@VisitorDetails_VisitorCustomValues
                    ,@PhoneNumber, @FinalDate, @IniDate, @Pin
                    ,@AccessRules1 ,@AccessRules2 ,@AccessRules3 ,@AccessRules4 ,@AccessRules5 ,@AccessRules6 ,@AccessRules7 ,@AccessRules8 ,@AccessRules9 ,@AccessRules10
                    ,@AccessRules11 ,@AccessRules12 ,@AccessRules13 ,@AccessRules14 ,@AccessRules15 ,@AccessRules16 ,@AccessRules17 ,@AccessRules18 ,@AccessRules19 ,@AccessRules20
                    ,@AccessRules21 ,@AccessRules22 ,@AccessRules23 ,@AccessRules24 ,@AccessRules25 ,@AccessRules26 ,@AccessRules27 ,@AccessRules28 ,@AccessRules29 ,@AccessRules30
                    ,@AccessRules31 ,@AccessRules32 ,@AccessRules33 ,@AccessRules34 ,@AccessRules35 ,@AccessRules36 ,@AccessRules37 ,@AccessRules38 ,@AccessRules39 ,@AccessRules40
                    ,@CustomDateControl3__CF1 ,@CustomDateControl3__CF2 ,@CustomDateControl3__CF3 ,@CustomDateControl3__CF4 ,@CustomDateControl3__CF5 ,@CustomDateControl3__CF6 
                    ,@CustomDateControl3__CF7 ,@CustomDateControl3__CF8 ,@CustomDateControl3__CF9 ,@CustomDateControl3__CF10,@CustomDateControl3__CF11,@CustomDateControl3__CF12 
                    ,@CustomDateControl4__CF ,@CustomDropdownControl1__CF ,@CustomDropdownControl2__CF1 ,@CustomDropdownControl2__CF2 ,@CustomDropdownControl3__CF1 
                    ,@CustomDropdownControl3__CF2 ,@CustomDropdownControl3__CF3 ,@CustomDropdownControl3__CF4 ,@CustomDropdownControl3__CF5 ,@CustomDropdownControl3__CF6 
                    ,@CustomTextBoxControl2__CF ,@CustomTextBoxControl3__CF ,@CustomTextBoxControl5__CF1 ,@CustomTextBoxControl5__CF2 ,@CustomTextBoxControl5__CF3 
                    ,@CustomTextBoxControl5__CF4 ,@CustomTextBoxControl5__CF5 ,@CustomTextBoxControl5__CF6 ,@CustomTextBoxControl5__CF7 ,@CustomTextBoxControl5__CF8 
                    ,@CustomTextBoxControl5__CF9 ,@CustomTextBoxControl5__CF10 ,@CustomTextBoxControl6__CF 
                    ,@CustomTextBoxControl7__CF1 ,@CustomTextBoxControl7__CF2 ,@CustomTextBoxControl7__CF3 ,@CustomTextBoxControl7__CF4 ,@CustomTextBoxControl7__CF5 ,@CustomTextBoxControl7__CF6 
                    ,@CustomTextBoxControl7__CF7 ,@CustomTextBoxControl7__CF8 ,@CustomTextBoxControl7__CF9 ,@CustomTextBoxControl7__CF10,@CustomTextBoxControl7__CF11,@CustomTextBoxControl7__CF12);
                select top 1 * from Member where EmployeeNumber >= @EmployeeNumber order by TimeStamp desc`);

        return res["recordset"][0];
    }
}