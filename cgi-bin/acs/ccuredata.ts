import {
    Action
} from 'core/cgi-package';
import { cCureAdapter } from 'workspace/custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from 'workspace/custom/services/acs/CCure800SqlAdapter';


var action = new Action({
    loginRequired: false    
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    let cCureAdapter = new CCure800SqlAdapter();
    let dt = {
        "AccessRules": [],
        "ApbWorkgroupId": 2000000006,
        "Attributes": {},
        "Credentials": [
            // {
            //     "CardNumber": "null",
            //     "EndDate": "",
            //     "Pin": "0000",
            //     "ProfileId": 1,
            //     "ProfileName": "基礎",
            //     "StartDate": "1997-06-14",
            //     "FacilityCode": 469,
            //     "CardTechnologyCode": 10,
            //     "PinMode": 4,
            //     "PinDigit": 6
            // }
        ],
        "EmployeeNumber": "60227",
        "EndDate": "2019-08-25",
        "FirstName": "Barnett Chu",
        "GeneralInformation": "",
        "LastName": "朱雄明",
        "NonPartitionWorkGroups": [],
        "PersonalDetails": {
            "Address": "",
            "ContactDetails": {
                "Email": "bchu@fareastone.com.tw",
                "MobileNumber": "0936291803",
                "MobileServiceProviderId": "0",
                "PagerNumber": "",
                "PagerServiceProviderId": "0",
                "PhoneNumber": ""
            },
            "DateOfBirth": "1962-06-14",
            "PayrollNumber": "",
            "Title": "",
            "UserDetails": {
                "UserName": "",
                "Password": ""
            }
        },
        "Potrait": "",
        "PrimaryWorkgroupId": 2000000006,
        "PrimaryWorkgroupName": "正職",
        "PrimaryWorkGroupAccessRule": [],
        "SmartCardProfileId": "0",
        "StartDate": "1997-06-14",
        "Status": 61,
        "Token": "-1",
        "TraceDetails": {},
        "Vehicle1": {},
        "Vehicle2": {},
        "VisitorDetails": {
            "VisitorCardStatus": 0,
            "VisitorCustomValues": {}
        },
        "CustomFields": [
            {
                "FiledName": "CustomDateControl4__CF",
                "FieldValue": "2019-08-25"
            },
            {
                "FiledName": "CustomDropdownControl1__CF",
                "FieldValue": "2000000006"
            },
            {
                "FiledName": "CustomTextBoxControl1__CF",
                "FieldValue": "60227"
            },
            {
                "FiledName": "CustomTextBoxControl3__CF",
                "FieldValue": ""
            },
            {
                "FiledName": "CustomTextBoxControl6__CF",
                "FieldValue": ""
            },
            {
                "FiledName": "CustomDropdownControl2__CF_CF",
                "FieldValue": "M"
            },
            {
                "FiledName": "CustomTextBoxControl5__CF_CF",
                "FieldValue": "549803"
            },
            {
                "FiledName": "CustomTextBoxControl5__CF_CF_CF",
                "FieldValue": ""
            },
            {
                "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF",
                "FieldValue": "2301"
            },
            {
                "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF",
                "FieldValue": "台中 Office"
            },
            {
                "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
                "FieldValue": ""
            },
            {
                "FiledName": "CustomDateControl1__CF_CF",
                "FieldValue": "1962-06-14"
            },
            {
                "FiledName": "CustomDateControl1__CF_CF_CF",
                "FieldValue": "1997-06-14"
            },
            {
                "FiledName": "CustomDateControl1__CF",
                "FieldValue": ""
            }
        ],
        "_links": []
    };
    try{
        await cCureAdapter.writeMember(dt,[],dt.CustomFields,"NH-Employee");
    }catch(err)
    {
        return err;
    }
   
    // let doorGroups = await cCureAdapter.getAllOrganizedDoorGroup();
    // let floorGroups = await cCureAdapter.getAllOrganizedFloorGroup();
    // return { doorGroups, floorGroups };
    return {result:"ok"}
});


export default action;

