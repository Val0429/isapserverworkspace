import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

// import * as msSQL from 'mssql';
import * as adodb from 'node-adodb';
import * as p from 'path';
import { PermissionTable, ILinearMember } from 'core/cgi-package';
import { ECardholderStatus } from 'workspace/custom/modules/acs/sipass';

export class CCure800SqlAdapter {

    private adodbConn = null;
    private adodbConn2 = null;
    constructor() {
        let dbPath=Config.ccureconnect.mdbpath || (p.dirname(__filename)+"\\mdb\\ccure800.mdb");
        let dbPath2=Config.ccureconnect.mdbpath2 || (p.dirname(__filename)+"\\mdb\\ccure8002.mdb");
        console.log("mdbpath", dbPath);
        console.log("mdbpath2", dbPath2);
        this.adodbConn = adodb.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};`);
        this.adodbConn2 = adodb.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath2};`);
        // this.waitTimer = setTimeout(() => {
        //     me.doHumanResourcesSync();
        // }, 1000 * this.startDelayTime);
    }

    async connect() {
        Log.Info(`${this.constructor.name}`, `connect`);

        // try {
        //     this.sqlClient = new msSQL.ConnectionPool(config);
        //     await this.sqlClient.connect();
        // }
        // catch (ex) {
        //     Log.Info(`${this.constructor.name}`, ex);
        // }
    }

    async disconnect() {
        Log.Info(`${this.constructor.name}`, `disconnect`);

        // try {
        //     await this.sqlClient.close();
        // }
        // catch (ex) {
        //     Log.Info(`${this.constructor.name}`, ex);
        // }
    }
    async clearMember(tableName:string="Member"){
        let delData = `Delete * From ${tableName}`;
    
            //console.log(insert);
    
            await this.adodbConn
                .execute(delData);
    }
    async writeMember(data:ILinearMember, accessRules:string[]) {
        console.log("write to mdb");
        let ccurePermissionTables = await new Parse.Query(PermissionTable)
                            .equalTo("system", 800)
                            .containedIn("tablename", accessRules)
                            .limit(Number.MAX_SAFE_INTEGER).find();
        let ccureAccessRules:string[] = [];
        //check if permission is in ccure
        for(let accessRule of accessRules){
            if(ccurePermissionTables.find(x=> x.get("tablename") == accessRule && ccureAccessRules.indexOf(accessRule)<0)){
                ccureAccessRules.push(accessRule);
            }
        }
        
        Log.Info(`${this.constructor.name}`, `writeMember ${JSON.stringify(data).substring(0, 100)}`);
        await this.writeToMdb(data, ccureAccessRules);        
    }
    async writeToMdb(data:ILinearMember, ccureAccessRules:string[], tableName:string="Member"){
        let rules = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
        
        for (let i = 0; i < rules.length; i++) {
            if(i>=ccureAccessRules.length)break;
            rules[i] = ccureAccessRules[i];
        }

        
        let insert = `INSERT INTO ${tableName}(
        EmployeeNumber, PD_DateOfBirth, PD_CD_MobileNumber, CustomTextBoxControl6__CF, CustomTextBoxControl5__CF4
        ,CustomTextBoxControl5__CF3, PD_CD_Email,LastName ,PrimaryWorkgroupName ,CustomDropdownControl1__CF
        ,FirstName ,StartDate ,PhoneNumber ,CustomTextBoxControl5__CF6 ,CustomTextBoxControl5__CF2
        ,CustomDropdownControl2__CF2 ,FinalDate ,EndDate ,Cred_CardNumber ,AccessRule40
        ,IniDate ,CustomTextBoxControl1__CF ,Pin ,CustomTextBoxControl3__CF, CustomDropdownControl3__CF5 
        ,CustomDropdownControl3__CF6 ,CustomDropdownControl3__CF ,CustomTextBoxControl5__CF5 ,CustomTextBoxControl5__CF9 ,CustomTextBoxControl5__CF        
        ,CustomTextBoxControl5__CF10 ,CustomTextBoxControl5__CF11 ,CustomTextBoxControl5__CF8 ,CustomDropdownControl2__CF ,CustomTextBoxControl7__CF11
        ,CustomTextBoxControl7__CF12 ,CustomTextBoxControl7__CF, CustomTextBoxControl7__CF8 ,CustomTextBoxControl7__CF9 ,CustomTextBoxControl7__CF10 
        ,CustomDropdownControl3__CF2 ,CustomDropdownControl3__CF3 ,CustomDropdownControl3__CF4 ,CustomTextBoxControl7__CF4 ,CustomTextBoxControl7__CF5 
        ,CustomTextBoxControl7__CF6 ,CustomTextBoxControl7__CF2 ,CustomTextBoxControl7__CF7 ,CustomTextBoxControl7__CF3 ,CustomTextBoxControl2__CF 
        ,AccessRule1 ,AccessRule2 ,AccessRule3 ,AccessRule4 ,AccessRule5 ,AccessRule6 ,AccessRule7 ,AccessRule8 ,AccessRule9 ,AccessRule10
        ,AccessRule11 ,AccessRule12 ,AccessRule13 ,AccessRule14 ,AccessRule15 ,AccessRule16 ,AccessRule17 ,AccessRule18 ,AccessRule19 ,AccessRule20
        ,AccessRule21 ,AccessRule22 ,AccessRule23 ,AccessRule24 ,AccessRule25 ,AccessRule26 ,AccessRule27 ,AccessRule28 ,AccessRule29 ,AccessRule30
        ,AccessRule31 ,AccessRule32 ,AccessRule33 ,AccessRule34 ,AccessRule35 ,AccessRule36 ,AccessRule37 ,AccessRule38 ,AccessRule39
        ,CustomDateControl4__CF  ,CustomDateControl3__CF11 ,CustomDateControl3__CF12 
        ,CustomDateControl3__CF  ,CustomDateControl3__CF2  ,CustomDateControl3__CF6
        ,CustomDateControl3__CF7 ,CustomDateControl3__CF5  ,CustomDateControl3__CF3
        ,CustomDateControl3__CF4 ,CustomDateControl3__CF8  ,CustomDateControl3__CF9 
        ,CustomDateControl3__CF10, Deleted, Disabled
        ) VALUES ( 
         '${data.employeeNumber || ""}'     
        , ${data.birthday? "'" + data.birthday.split("T")[0]+ "'" : "NULL"}
        ,'${data.extensionNumber || ""}'
        ,'${data.companyName || ""}'
        ,'${data.costCenter || ""}'
        ,'${data.department || ""}'
        ,'${data.email || ""}'
        ,'${data.chineseName || ""}'
        ,'${data.primaryWorkgroupName}'
        ,'${data.cardType  || "無"}'
        ,'${data.englishName || "-"}'
        ,'${data.startDate.split("T")[0]}'
        ,'${data.phone || ""}'
        ,'${data.workArea || ""}'
        ,'${data.MVPN || ""}'
        ,'${data.gender || "無" }'
        ,'${data.endDate.split("T")[0]}'
        ,'${data.endDate.split("T")[0]}'
        ,'${data.cardNumber || ""}'
        ,'${rules[39] == undefined ? '' : rules[39]}'
        ,'${data.startDate.split("T")[0]}'
        ,'${data.allCardNumber || ""}'
        ,'${data.pin || ""}'
        ,'${data.lastEditPerson || ""}'
        ,'${data.reasonForApplication1 || "無" }'
        ,'${data.reasonForApplication2 || "無" }'
        ,'${data.reasonForApplication3 || "無" }'
        ,'${data.area || ""}'
        ,'${data.carLicense || ""}'
        ,'${data.carLicense1 || ""}'
        ,'${data.carLicense2 || ""}'
        ,'${data.carLicense3 || ""}'
        ,'${data.cardLicense || ""}'
        ,'${data.carLicenseCategory || "無" }'
        ,'${data.censusRecord1 || "" }'
        ,'${data.censusRecord2 || "" }'
        ,'${data.censusRecord3 || "" }'
        ,'${data.infoOfViolation1 || "" }'
        ,'${data.infoOfViolation2 || "" }'
        ,'${data.infoOfViolation3 || "" }'
        ,'${data.reasonForCard1 || "無" }'
        ,'${data.reasonForCard2 || "無" }'
        ,'${data.reasonForCard3 || "無" }'
        ,'${data.historyForCard1 || "" }'
        ,'${data.historyForCard2 || "" }'
        ,'${data.historyForCard3 || "" }'
        ,'${data.resignationNote || "" }'
        ,'${data.resignationRecordCarLicense || "" }'
        ,'${data.resignationRecordCardRecord || "" }'
        ,'${data.cardCustodian || "" }'
        ,'${rules[0] == undefined ? '' : rules[0]}' 
        ,'${rules[1] == undefined ? '' : rules[1]}'
        ,'${rules[2] == undefined ? '' : rules[2]}'
        ,'${rules[3] == undefined ? '' : rules[3]}'
        ,'${rules[4] == undefined ? '' : rules[4]}'
        ,'${rules[5] == undefined ? '' : rules[5]}'
        ,'${rules[6] == undefined ? '' : rules[6]}'
        ,'${rules[7] == undefined ? '' : rules[7]}'
        ,'${rules[8] == undefined ? '' : rules[8]}'
        ,'${rules[9] == undefined ? '' : rules[9]}'
        ,'${rules[10] == undefined ? '' : rules[10]}'
        ,'${rules[11] == undefined ? '' : rules[11]}'
        ,'${rules[12] == undefined ? '' : rules[12]}'
        ,'${rules[13] == undefined ? '' : rules[13]}'
        ,'${rules[14] == undefined ? '' : rules[14]}'
        ,'${rules[15] == undefined ? '' : rules[15]}'
        ,'${rules[16] == undefined ? '' : rules[16]}'
        ,'${rules[17] == undefined ? '' : rules[17]}'
        ,'${rules[18] == undefined ? '' : rules[18]}'
        ,'${rules[19] == undefined ? '' : rules[19]}'
        ,'${rules[20] == undefined ? '' : rules[20]}'
        ,'${rules[21] == undefined ? '' : rules[21]}'
        ,'${rules[22] == undefined ? '' : rules[22]}'
        ,'${rules[23] == undefined ? '' : rules[23]}'
        ,'${rules[24] == undefined ? '' : rules[24]}'
        ,'${rules[25] == undefined ? '' : rules[25]}'
        ,'${rules[26] == undefined ? '' : rules[26]}'
        ,'${rules[27] == undefined ? '' : rules[27]}'
        ,'${rules[28] == undefined ? '' : rules[28]}'
        ,'${rules[29] == undefined ? '' : rules[29]}'
        ,'${rules[30] == undefined ? '' : rules[30]}'
        ,'${rules[31] == undefined ? '' : rules[31]}'
        ,'${rules[32] == undefined ? '' : rules[32]}'
        ,'${rules[33] == undefined ? '' : rules[33]}'
        ,'${rules[34] == undefined ? '' : rules[34]}'
        ,'${rules[35] == undefined ? '' : rules[35]}'
        ,'${rules[36] == undefined ? '' : rules[36]}'
        ,'${rules[37] == undefined ? '' : rules[37]}'
        ,'${rules[38] == undefined ? '' : rules[38]}'
        ,${data.lastEditTime ? "'"+data.lastEditTime.split("T")[0] + "'" : "NULL" }
        ,${data.censusDate1 ? "'"+data.censusDate1.split("T")[0] + "'" : "NULL" }
        ,${data.censusDate2 ? "'"+data.censusDate2.split("T")[0] + "'" : "NULL" }
        ,${data.censusDate3 ? "'"+data.censusDate3.split("T")[0] + "'" : "NULL" }
        ,${data.dateForCard1 ? "'"+data.dateForCard1.split("T")[0] + "'" : "NULL" }
        ,${data.dateForCard2 ? "'"+data.dateForCard2.split("T")[0] + "'" : "NULL" }
        ,${data.dateForCard3 ? "'"+data.dateForCard3.split("T")[0] + "'" : "NULL" }
        ,${data.dateForApplication1 ? "'"+data.dateForApplication1.split("T")[0] + "'" : "NULL" }
        ,${data.dateForApplication2 ? "'"+data.dateForApplication2.split("T")[0] + "'" : "NULL" }
        ,${data.dateForApplication3 ? "'"+data.dateForApplication3.split("T")[0] + "'" : "NULL" }
        ,${data.dateOfViolation1 ? "'"+data.dateOfViolation1.split("T")[0] + "'" : "NULL" }
        ,${data.dateOfViolation2 ? "'"+data.dateOfViolation2.split("T")[0] + "'" : "NULL" }
        ,${data.dateOfViolation3 ? "'"+data.dateOfViolation3.split("T")[0] + "'" : "NULL" }
        ,${data.status == ECardholderStatus.Deleted ? -1 : 0}, ${data.void==true ? -1 : 0}
        )`;
        
        //console.log(insert);

        await this.adodbConn
            .execute(insert)
            // .then(data => {
            //     console.log(JSON.stringify(data, null, 2));
            // })
            // .catch(error => {
            //     console.error(error);
            // });
        await this.adodbConn2
        .execute(insert)
        // .then(data => {
        //     console.log(JSON.stringify(data, null, 2));
        // })
        // .catch(error => {
        //     console.error(error);
        // });
        //return null;
    }
}