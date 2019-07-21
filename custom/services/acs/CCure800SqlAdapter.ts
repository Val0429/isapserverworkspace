import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

// import * as msSQL from 'mssql';
import * as adodb from 'node-adodb';
import * as p from 'path';

export class CCure800SqlAdapter {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient = null;
    private adodbConn = null;

    constructor() {
        var me = this;

        // this.adodbConn = adodb.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${p.dirname(__filename)}\\ccure800.mdb;`);
        this.adodbConn = adodb.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=z:\\manager\\ccure800.mdb;`);

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

        for (let i = 0; i < data["CustomFields"]; i++) {
            const field = data["CustomFields"][i];

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
        
        let insert = `INSERT INTO Member(
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
        ,CustomDateControl3__CF10 
        ) VALUES ( 
         '${data["EmployeeNumber"]}'     , '${data["PersonalDetails"]["DateOfBirth"]}'            , '${data["PersonalDetails"]["ContactDetails"]["MobileNumber"]}', '${CustomTextBoxControl6__CF}'        , '${CustomTextBoxControl5__CF4}'
        ,'${CustomTextBoxControl5__CF3}' , '${data["PersonalDetails"]["ContactDetails"]["Email"]}', '${data["LastName"]}'                                         , '${data["PrimaryWorkgroupName"]}'     , '${CustomDropdownControl1__CF}'
        ,'${data["FirstName"]}'          , '${data["StartDate"]}'                                 , '${data["PersonalDetails"]["ContactDetails"]["MobileNumber"]}', '${CustomTextBoxControl5__CF6}'       , '${CustomTextBoxControl5__CF2}'
        ,'${CustomDropdownControl2__CF2}', '${data["EndDate"]}'                                   , '${data["EndDate"]}'                                          , '${data["Credentials"]["CardNumber"]}', '${rules[39]}'
        ,'${data["StartDate"]}'          , '${CustomTextBoxControl1__CF}'                         , '${data["Credentials"]["Pin"]}'                               , '${CustomTextBoxControl3__CF}'        ,'${CustomDropdownControl3__CF5}'
        ,'${CustomDropdownControl3__CF6}', '${CustomDropdownControl3__CF1}'                       , '${CustomTextBoxControl5__CF5}'                               , '${CustomTextBoxControl5__CF9}'       , '${CustomTextBoxControl5__CF1}'
        ,'${CustomTextBoxControl5__CF10}', '${CustomTextBoxControl5__CF11}'                       , '${CustomTextBoxControl5__CF8}'                               , '${CustomDropdownControl2__CF1}'      , '${CustomTextBoxControl7__CF11}'
        ,'${CustomTextBoxControl7__CF12}', '${CustomTextBoxControl7__CF1}'                        , '${CustomTextBoxControl7__CF8}'                               , '${CustomTextBoxControl7__CF9}'       , '${CustomTextBoxControl7__CF10}'
        ,'${CustomDropdownControl3__CF2}', '${CustomDropdownControl3__CF3}'                       , '${CustomDropdownControl3__CF4}'                              , '${CustomTextBoxControl7__CF4}'       , '${CustomTextBoxControl7__CF5}'
        ,'${CustomTextBoxControl7__CF6}' , '${CustomTextBoxControl7__CF2}'                        , '${CustomTextBoxControl7__CF7}'                               , '${CustomTextBoxControl7__CF3}'       , '${CustomTextBoxControl2__CF}'
        ,'${rules[0]}' , '${rules[1]}' , '${rules[2]}' , '${rules[3]}' , '${rules[4]}' , '${rules[5]}' , '${rules[6]}' , '${rules[7]}' , '${rules[8]}' , '${rules[9]}'
        ,'${rules[10]}', '${rules[11]}', '${rules[12]}', '${rules[13]}', '${rules[14]}', '${rules[15]}', '${rules[16]}', '${rules[17]}', '${rules[18]}', '${rules[19]}'
        ,'${rules[20]}', '${rules[21]}', '${rules[22]}', '${rules[23]}', '${rules[24]}', '${rules[25]}', '${rules[26]}', '${rules[27]}', '${rules[28]}', '${rules[29]}'
        ,'${rules[30]}', '${rules[31]}', '${rules[32]}', '${rules[33]}', '${rules[34]}', '${rules[35]}', '${rules[36]}', '${rules[37]}', '${rules[38]}'
        , ${CustomDateControl4__CF   ? CustomDateControl4__CF   : 'Null' }, ${CustomDateControl3__CF11 ? CustomDateControl3__CF11 : 'Null' }, ${CustomDateControl3__CF12 ? CustomDateControl3__CF12 : 'Null' }
        , ${CustomDateControl3__CF1  ? CustomDateControl3__CF1  : 'Null' }, ${CustomDateControl3__CF2  ? CustomDateControl3__CF2  : 'Null' }, ${CustomDateControl3__CF6  ? CustomDateControl3__CF6  : 'Null' }
        , ${CustomDateControl3__CF7  ? CustomDateControl3__CF7  : 'Null' }, ${CustomDateControl3__CF5  ? CustomDateControl3__CF5  : 'Null' }, ${CustomDateControl3__CF3  ? CustomDateControl3__CF3  : 'Null' }
        , ${CustomDateControl3__CF4  ? CustomDateControl3__CF4  : 'Null' }, ${CustomDateControl3__CF8  ? CustomDateControl3__CF8  : 'Null' }, ${CustomDateControl3__CF9  ? CustomDateControl3__CF9  : 'Null' }
        , ${CustomDateControl3__CF10 ? CustomDateControl3__CF10 : 'Null' }
        )`;
        
        console.log(insert);

        this.adodbConn
            .execute(insert)
            .then(data => {
                console.log(JSON.stringify(data, null, 2));
            })
            .catch(error => {
                console.error(error);
            });

        return null;
    }
}