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
                ,[AccessRules1] ,[AccessRules2] ,[AccessRules3] ,[AccessRules4] ,[AccessRules5] ,[AccessRules6] ,[AccessRules7] ,[AccessRules8] ,[AccessRules9] ,[AccessRules10]
                ,[AccessRules11] ,[AccessRules12] ,[AccessRules13] ,[AccessRules14] ,[AccessRules15] ,[AccessRules16] ,[AccessRules17] ,[AccessRules18] ,[AccessRules19] ,[AccessRules20]
                ,[AccessRules21] ,[AccessRules22] ,[AccessRules23] ,[AccessRules24] ,[AccessRules25] ,[AccessRules26] ,[AccessRules27] ,[AccessRules28] ,[AccessRules29] ,[AccessRules30]
                ,[AccessRules31] ,[AccessRules32] ,[AccessRules33] ,[AccessRules34] ,[AccessRules35] ,[AccessRules36] ,[AccessRules37] ,[AccessRules38] ,[AccessRules39] ,[AccessRules40])
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
                    ,@AccessRules1 ,@AccessRules2 ,@AccessRules3 ,@AccessRules4 ,@AccessRules5 ,@AccessRules6 ,@AccessRules7 ,@AccessRules8 ,@AccessRules9 ,@AccessRules10
                    ,@AccessRules11 ,@AccessRules12 ,@AccessRules13 ,@AccessRules14 ,@AccessRules15 ,@AccessRules16 ,@AccessRules17 ,@AccessRules18 ,@AccessRules19 ,@AccessRules20
                    ,@AccessRules21 ,@AccessRules22 ,@AccessRules23 ,@AccessRules24 ,@AccessRules25 ,@AccessRules26 ,@AccessRules27 ,@AccessRules28 ,@AccessRules29 ,@AccessRules30
                    ,@AccessRules31 ,@AccessRules32 ,@AccessRules33 ,@AccessRules34 ,@AccessRules35 ,@AccessRules36 ,@AccessRules37 ,@AccessRules38 ,@AccessRules39 ,@AccessRules40);
                select top 1 * from Member where EmployeeNumber >= @EmployeeNumber order by TimeStamp desc`);

        return res["recordset"][0];
    }
}