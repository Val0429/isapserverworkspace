import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

// import * as msSQL from 'mssql';
import * as adodb from 'node-adodb';
import * as p from 'path';
import moment = require('moment');
import { PermissionTable } from 'core/cgi-package';

export class CCure800SqlAdapter {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient = null;
    private adodbConn = null;
    private adodbConn2 = null;
    constructor() {
        var me = this;
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

    async connect(config) {
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
    
            this.adodbConn
                .execute(delData)
                .then(data => {
                    console.log(JSON.stringify(data, null, 2));
                })
                .catch(error => {
                    console.error(error);
                });
    
            return null;
    }
    async writeMember(data, accessRules:string[], customFields:any[], permission = "") {
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
        await this.writeToMdb(data, ccureAccessRules, customFields, permission);        
    }
    async writeToMdb(data, ccureAccessRules:string[], customFields:any[], permission = "", tableName:string="Member"){
        let rules = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", permission];
        
        for (let i = 0; i < rules.length; i++) {
            if(i>=ccureAccessRules.length)break;
            rules[i] = ccureAccessRules[i];
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
        let CustomTextBoxControl5__CF8 = "";
        let CustomTextBoxControl5__CF9 = "";
        let CustomTextBoxControl5__CF10 = "";
        let CustomTextBoxControl5__CF11 = "";
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
        
        for (let field of customFields) {
            
            switch (field["FiledName"]) {
                case "CustomDateControl3__CF": CustomDateControl3__CF1 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF": CustomDateControl3__CF2 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF": CustomDateControl3__CF3 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF": CustomDateControl3__CF4 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF": CustomDateControl3__CF5 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF": CustomDateControl3__CF6 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF7 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF8 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF9 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF10 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF11 = field["FieldValue"]; break;
                case "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomDateControl3__CF12 = field["FieldValue"]; break;
                case "CustomDateControl4__CF": CustomDateControl4__CF = field["FieldValue"]; break;
                case "CustomDropdownControl1__CF": CustomDropdownControl1__CF = field["FieldValue"]; break;
                case "CustomDropdownControl2__CF": CustomDropdownControl2__CF1 = field["FieldValue"]; break;
                case "CustomDropdownControl2__CF_CF": CustomDropdownControl2__CF2 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF": CustomDropdownControl3__CF1 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF_CF": CustomDropdownControl3__CF2 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF_CF_CF": CustomDropdownControl3__CF3 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF_CF_CF_CF": CustomDropdownControl3__CF4 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF_CF_CF_CF_CF": CustomDropdownControl3__CF5 = field["FieldValue"]; break;
                case "CustomDropdownControl3__CF_CF_CF_CF_CF_CF": CustomDropdownControl3__CF6 = field["FieldValue"]; break;
                case "CustomTextBoxControl1__CF": CustomTextBoxControl1__CF = field["FieldValue"]; break;
                case "CustomTextBoxControl2__CF": CustomTextBoxControl2__CF = field["FieldValue"]; break;
                case "CustomTextBoxControl3__CF": CustomTextBoxControl3__CF = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF": CustomTextBoxControl5__CF1 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF": CustomTextBoxControl5__CF2 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF": CustomTextBoxControl5__CF3 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF": CustomTextBoxControl5__CF4 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF": CustomTextBoxControl5__CF5 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF6 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF8 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF9 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF10 = field["FieldValue"]; break;
                case "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl5__CF11 = field["FieldValue"]; break;
                case "CustomTextBoxControl6__CF": CustomTextBoxControl6__CF = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF": CustomTextBoxControl7__CF1 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF": CustomTextBoxControl7__CF2 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF": CustomTextBoxControl7__CF3 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF": CustomTextBoxControl7__CF4 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF": CustomTextBoxControl7__CF5 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF6 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF7 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF8 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF9 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF10 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF11 = field["FieldValue"]; break;
                case "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF": CustomTextBoxControl7__CF12 = field["FieldValue"]; break;
            }
        }
        let credential = data["Credentials"] && data["Credentials"][0]? data["Credentials"][0]:undefined;
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
        ,CustomDateControl3__CF10, Deleted
        ) VALUES ( 
         '${data["EmployeeNumber"]}'     
        , ${data["PersonalDetails"]["DateOfBirth"] ? "'" + moment(data["PersonalDetails"]["DateOfBirth"]).format("YYYY-MM-DD")+ "'" : "NULL"}
        ,'${data["PersonalDetails"]["ContactDetails"]["MobileNumber"]}'
        ,'${CustomTextBoxControl6__CF}'
        ,'${CustomTextBoxControl5__CF4}'
        ,'${CustomTextBoxControl5__CF3}'
        ,'${data["PersonalDetails"]["ContactDetails"]["Email"]}'
        ,'${data["LastName"]}'
        ,'${data["PrimaryWorkgroupName"]}'
        ,'${CustomDropdownControl1__CF == '' ? '無' : CustomDropdownControl1__CF}'
        ,'${data["FirstName"]}'
        ,'${ moment(data["StartDate"]).format("YYYY-MM-DD")}'
        ,'${data["PersonalDetails"]["ContactDetails"]["PhoneNumber"]}'
        ,'${CustomTextBoxControl5__CF6}'
        ,'${CustomTextBoxControl5__CF2}'
        ,'${CustomDropdownControl2__CF2 == '' ? '無' : CustomDropdownControl2__CF2}'
        ,'${ moment(data["EndDate"]).format("YYYY-MM-DD")}'
        ,'${ moment(data["EndDate"]).format("YYYY-MM-DD")}'
        ,'${credential? credential.CardNumber  : ""}'
        ,'${rules[39] == undefined ? '' : rules[39]}'
        ,'${ moment(data["StartDate"]).format("YYYY-MM-DD")}'
        ,'${CustomTextBoxControl1__CF ||""}'
        ,'${credential ? credential.Pin:""}'
        ,'${CustomTextBoxControl3__CF}'
        ,'${CustomDropdownControl3__CF5 == '' ? '無' : CustomDropdownControl3__CF5}'
        ,'${CustomDropdownControl3__CF6 == '' ? '無' : CustomDropdownControl3__CF6}'
        ,'${CustomDropdownControl3__CF1 == '' ? '無' : CustomDropdownControl3__CF1}'
        ,'${CustomTextBoxControl5__CF5}'
        ,'${CustomTextBoxControl5__CF9}'
        ,'${CustomTextBoxControl5__CF1}'
        ,'${CustomTextBoxControl5__CF10}'
        ,'${CustomTextBoxControl5__CF11}'
        ,'${CustomTextBoxControl5__CF8}'
        ,'${CustomDropdownControl2__CF1 == '' ? '無' : CustomDropdownControl2__CF1}'
        ,'${CustomTextBoxControl7__CF11}'
        ,'${CustomTextBoxControl7__CF12}'
        ,'${CustomTextBoxControl7__CF1}'
        ,'${CustomTextBoxControl7__CF8}'
        ,'${CustomTextBoxControl7__CF9}'
        ,'${CustomTextBoxControl7__CF10}'
        ,'${CustomDropdownControl3__CF2 == '' ? '無' : CustomDropdownControl3__CF2}'
        ,'${CustomDropdownControl3__CF3 == '' ? '無' : CustomDropdownControl3__CF3}'
        ,'${CustomDropdownControl3__CF4 == '' ? '無' : CustomDropdownControl3__CF4}'
        ,'${CustomTextBoxControl7__CF4}'
        ,'${CustomTextBoxControl7__CF5}'
        ,'${CustomTextBoxControl7__CF6}'
        ,'${CustomTextBoxControl7__CF2}'
        ,'${CustomTextBoxControl7__CF7}'
        ,'${CustomTextBoxControl7__CF3}'
        ,'${CustomTextBoxControl2__CF}'
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
        ,${CustomDateControl4__CF ? "'"+moment(CustomDateControl4__CF).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF11 ? "'"+moment(CustomDateControl3__CF11).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF12 ? "'"+moment(CustomDateControl3__CF12).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF1 ? "'"+moment(CustomDateControl3__CF1).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF2 ? "'"+moment(CustomDateControl3__CF2).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF6 ? "'"+moment(CustomDateControl3__CF6).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF7 ? "'"+moment(CustomDateControl3__CF7).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF5 ? "'"+moment(CustomDateControl3__CF5).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF3 ? "'"+moment(CustomDateControl3__CF3).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF4 ? "'"+moment(CustomDateControl3__CF4).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF8 ? "'"+moment(CustomDateControl3__CF8).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF9 ? "'"+moment(CustomDateControl3__CF9).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${CustomDateControl3__CF10 ? "'"+moment(CustomDateControl3__CF10).format("YYYY-MM-DD") + "'" : "NULL" }
        ,${data.Status == "1"? -1 : 0}
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
        return null;
    }
}