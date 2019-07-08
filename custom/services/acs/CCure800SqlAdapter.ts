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
        Log.Info(`${this.constructor.name}`, `writeMember ${ JSON.stringify(data).substring(0, 100)}`);

        let rules = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
        let access = data["AccessRules"];

        for (let i = 0; i < access.length; i++) {
            rules[i] = access[i]["objectName"];
        }

        let res = await this.sqlClient.request()
            .input('ApbWorkgroupId', msSQL.NVarChar(50), data["ApbWorkgroupId"])
            .input('Attributes', msSQL.NVarChar(50), JSON.stringify(data["Attributes"]))
            .input('Credentials_CardNumber', msSQL.NVarChar(50), data["Credentials"]["CardNumber"])
            .input('Credentials_EndDate', msSQL.NVarChar(50), data["Credentials"]["EndDate"])
            .input('Credentials_Pin', msSQL.NVarChar(50), data["Credentials"]["Pin"])
            .input('Credentials_ProfileId', msSQL.NVarChar(50), data["Credentials"]["ProfileId"])
            .input('Credentials_ProfileName', msSQL.NVarChar(50), data["Credentials"]["ProfileName"])
            .input('Credentials_StartDate', msSQL.NVarChar(50), data["Credentials"]["StartDate"])
            .input('Credentials_FacilityCode', msSQL.NVarChar(50), data["Credentials"]["FacilityCode"])
            .input('Credentials_CardTechnologyCode', msSQL.NVarChar(50), data["Credentials"]["CardTechnologyCode"])
            .input('Credentials_PinMode', msSQL.NVarChar(50), data["Credentials"]["PinMode"])
            .input('Credentials_PinDigit', msSQL.NVarChar(50), data["Credentials"]["PinDigit"])

            .input('EmployeeNumber', msSQL.NVarChar(50), data["EmployeeNumber"])
            .input('EndDate', msSQL.NVarChar(50), data["EndDate"])
            .input('FirstName', msSQL.NVarChar(50), data["FirstName"])
            .input('GeneralInformation', msSQL.NVarChar(50), data["GeneralInformation"])
            .input('LastName', msSQL.NVarChar(50), data["LastName"])
            .input('NonPartitionWorkGroups', msSQL.NVarChar(50), data["NonPartitionWorkGroups"])

            .input('PersonalDetails_Address', msSQL.NVarChar(50), data["PersonalDetails"]["Address"])
            .input('PersonalDetails_ContactDetails_Email', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["Email"])
            .input('PersonalDetails_ContactDetails_MobileNumber', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["MobileNumber"])
            .input('PersonalDetails_ContactDetails_MobileServiceProviderId', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["MobileServiceProviderId"])
            .input('PersonalDetails_ContactDetails_PagerNumber', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["PagerNumber"])
            .input('PersonalDetails_ContactDetails_PagerServiceProviderId', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["PagerServiceProviderId"])
            .input('PersonalDetails_ContactDetails_PhoneNumber', msSQL.NVarChar(50), data["PersonalDetails"]["ContactDetails"]["PhoneNumber"])
            .input('PersonalDetails_DateOfBirth', msSQL.NVarChar(50), data["PersonalDetails"]["DateOfBirth"])
            .input('PersonalDetails_PayrollNumber', msSQL.NVarChar(50), data["PersonalDetails"]["PayrollNumber"])
            .input('PersonalDetails_Title', msSQL.NVarChar(50), data["PersonalDetails"]["Title"])
            .input('PersonalDetails_UserDetails_UserName', msSQL.NVarChar(50), data["PersonalDetails"]["UserDetails"]["UserName"])
            .input('PersonalDetails_UserDetails_Password', msSQL.NVarChar(50), data["PersonalDetails"]["UserDetails"]["Password"])

            .input('Potrait', msSQL.NVarChar(50), data["Potrait"])
            .input('PrimaryWorkgroupId', msSQL.NVarChar(50), data["PrimaryWorkgroupId"])
            .input('PrimaryWorkgroupName', msSQL.NVarChar(50), data["PrimaryWorkgroupName"])
            .input('SmartCardProfileId', msSQL.NVarChar(50), data["SmartCardProfileId"])
            .input('StartDate', msSQL.NVarChar(50), data["StartDate"])
            .input('Status', msSQL.NVarChar(50), data["Status"])
            .input('Token', msSQL.NVarChar(50), data["Token"])
            .input('TraceDetails', msSQL.NVarChar(50), JSON.stringify(data["TraceDetails"]))
            .input('Vehicle1', msSQL.NVarChar(50), JSON.stringify(data["Vehicle1"]))
            .input('Vehicle2', msSQL.NVarChar(50), JSON.stringify(data["Vehicle2"]))
            .input('VisitorDetails_VisitorCardStatus', msSQL.NVarChar(50), data["VisitorDetails"]["VisitorCardStatus"])
            .input('VisitorDetails_VisitorCustomValues', msSQL.NVarChar(50), JSON.stringify(data["VisitorDetails"]["VisitorCustomValues"]))

            .input('AccessRules1', msSQL.NVarChar(50), rules[0])
            .input('AccessRules2', msSQL.NVarChar(50), rules[1])
            .input('AccessRules3', msSQL.NVarChar(50), rules[2])
            .input('AccessRules4', msSQL.NVarChar(50), rules[3])
            .input('AccessRules5', msSQL.NVarChar(50), rules[4])
            .input('AccessRules6', msSQL.NVarChar(50), rules[5])
            .input('AccessRules7', msSQL.NVarChar(50), rules[6])
            .input('AccessRules8', msSQL.NVarChar(50), rules[7])
            .input('AccessRules9', msSQL.NVarChar(50), rules[8])
            .input('AccessRules10', msSQL.NVarChar(50), rules[9])
            .input('AccessRules11', msSQL.NVarChar(50), rules[10])
            .input('AccessRules12', msSQL.NVarChar(50), rules[11])
            .input('AccessRules13', msSQL.NVarChar(50), rules[12])
            .input('AccessRules14', msSQL.NVarChar(50), rules[13])
            .input('AccessRules15', msSQL.NVarChar(50), rules[14])
            .input('AccessRules16', msSQL.NVarChar(50), rules[15])
            .input('AccessRules17', msSQL.NVarChar(50), rules[16])
            .input('AccessRules18', msSQL.NVarChar(50), rules[17])
            .input('AccessRules19', msSQL.NVarChar(50), rules[18])
            .input('AccessRules20', msSQL.NVarChar(50), rules[19])
            .input('AccessRules21', msSQL.NVarChar(50), rules[20])
            .input('AccessRules22', msSQL.NVarChar(50), rules[21])
            .input('AccessRules23', msSQL.NVarChar(50), rules[22])
            .input('AccessRules24', msSQL.NVarChar(50), rules[23])
            .input('AccessRules25', msSQL.NVarChar(50), rules[24])
            .input('AccessRules26', msSQL.NVarChar(50), rules[25])
            .input('AccessRules27', msSQL.NVarChar(50), rules[26])
            .input('AccessRules28', msSQL.NVarChar(50), rules[27])
            .input('AccessRules29', msSQL.NVarChar(50), rules[28])
            .input('AccessRules30', msSQL.NVarChar(50), rules[29])
            .input('AccessRules31', msSQL.NVarChar(50), rules[30])
            .input('AccessRules32', msSQL.NVarChar(50), rules[31])
            .input('AccessRules33', msSQL.NVarChar(50), rules[32])
            .input('AccessRules34', msSQL.NVarChar(50), rules[33])
            .input('AccessRules35', msSQL.NVarChar(50), rules[34])
            .input('AccessRules36', msSQL.NVarChar(50), rules[35])
            .input('AccessRules37', msSQL.NVarChar(50), rules[36])
            .input('AccessRules38', msSQL.NVarChar(50), rules[37])
            .input('AccessRules39', msSQL.NVarChar(50), rules[38])
            .input('AccessRules40', msSQL.NVarChar(50), rules[39])
            .query(`insert into Momber([TimeStamp] ,[ApbWorkgroupId] ,[Attributes] 
                ,[Credentials_CardNumber] ,[Credentials_EndDate] ,[Credentials_Pin] ,[Credentials_ProfileId] ,[Credentials_ProfileName] ,[Credentials_StartDate] ,[Credentials_FacilityCode]
                ,[Credentials_CardTechnologyCode] ,[Credentials_PinMode] ,[Credentials_PinDigit]
                ,[EmployeeNumber] ,[EndDate] ,[FirstName] ,[GeneralInformation] ,[LastName] ,[NonPartitionWorkGroups] 
                ,[PersonalDetails_Address] ,[PersonalDetails_ContactDetails_Email] ,[PersonalDetails_ContactDetails_MobileNumber] ,[PersonalDetails_ContactDetails_MobileServiceProviderId]
                ,[PersonalDetails_ContactDetails_PagerNumber] ,[PersonalDetails_ContactDetails_PagerServiceProviderId] ,[PersonalDetails_ContactDetails_PhoneNumber] ,[PersonalDetails_DateOfBirth]
                ,[PersonalDetails_PayrollNumber] ,[PersonalDetails_Title] ,[PersonalDetails_UserDetails_UserName] ,[PersonalDetails_UserDetails_Password]
                ,[Potrait] ,[PrimaryWorkgroupId] ,[PrimaryWorkgroupName] ,[SmartCardProfileId] ,[StartDate] ,[Status] ,[Token] ,[TraceDetails] ,[Vehicle1] ,[Vehicle2] 
                ,[VisitorDetails_VisitorCardStatus] ,[VisitorDetails_VisitorCustomValues]
                ,[AccessRules1] ,[AccessRules2] ,[AccessRules3] ,[AccessRules4] ,[AccessRules5] ,[AccessRules6] ,[AccessRules7] ,[AccessRules8] ,[AccessRules9] ,[AccessRules10]
                ,[AccessRules11] ,[AccessRules12] ,[AccessRules13] ,[AccessRules14] ,[AccessRules15] ,[AccessRules16] ,[AccessRules17] ,[AccessRules18] ,[AccessRules19] ,[AccessRules20]
                ,[AccessRules21] ,[AccessRules22] ,[AccessRules23] ,[AccessRules24] ,[AccessRules25] ,[AccessRules26] ,[AccessRules27] ,[AccessRules28] ,[AccessRules29] ,[AccessRules30]
                ,[AccessRules31] ,[AccessRules32] ,[AccessRules33] ,[AccessRules34] ,[AccessRules35] ,[AccessRules36] ,[AccessRules37] ,[AccessRules38] ,[AccessRules39] ,[AccessRules40])
                values (
                    getdate(), @ApbWorkgroupId ,@Attributes 
                    ,@Credentials_CardNumber ,@Credentials_EndDate ,@Credentials_Pin ,@Credentials_ProfileId ,@Credentials_ProfileName ,@Credentials_StartDate ,@Credentials_FacilityCode
                    ,@Credentials_CardTechnologyCode ,@Credentials_PinMode ,@Credentials_PinDigit
                    ,@EmployeeNumber ,@EndDate ,@FirstName ,@GeneralInformation ,@LastName ,@NonPartitionWorkGroups 
                    ,@PersonalDetails_Address ,@PersonalDetails_ContactDetails_Email ,@PersonalDetails_ContactDetails_MobileNumber ,@PersonalDetails_ContactDetails_MobileServiceProviderId
                    ,@PersonalDetails_ContactDetails_PagerNumber ,@PersonalDetails_ContactDetails_PagerServiceProviderId ,@PersonalDetails_ContactDetails_PhoneNumber ,@PersonalDetails_DateOfBirth
                    ,@PersonalDetails_PayrollNumber ,@PersonalDetails_Title ,@PersonalDetails_UserDetails_UserName ,@PersonalDetails_UserDetails_Password
                    ,@Potrait ,@PrimaryWorkgroupId ,@PrimaryWorkgroupName ,@SmartCardProfileId ,@StartDate ,@Status ,@Token ,@TraceDetails ,@Vehicle1 ,@Vehicle2 
                    ,@VisitorDetails_VisitorCardStatus ,@VisitorDetails_VisitorCustomValues
                    ,@AccessRules1 ,@AccessRules2 ,@AccessRules3 ,@AccessRules4 ,@AccessRules5 ,@AccessRules6 ,@AccessRules7 ,@AccessRules8 ,@AccessRules9 ,@AccessRules10
                    ,@AccessRules11 ,@AccessRules12 ,@AccessRules13 ,@AccessRules14 ,@AccessRules15 ,@AccessRules16 ,@AccessRules17 ,@AccessRules18 ,@AccessRules19 ,@AccessRules20
                    ,@AccessRules21 ,@AccessRules22 ,@AccessRules23 ,@AccessRules24 ,@AccessRules25 ,@AccessRules26 ,@AccessRules27 ,@AccessRules28 ,@AccessRules29 ,@AccessRules30
                    ,@AccessRules31 ,@AccessRules32 ,@AccessRules33 ,@AccessRules34 ,@AccessRules35 ,@AccessRules36 ,@AccessRules37 ,@AccessRules38 ,@AccessRules39 ,@AccessRules40);
                select top 1 * from Momber where EmployeeNumber >= @EmployeeNumber order by TimeStamp desc`);

        return res["recordset"][0];
    }
}