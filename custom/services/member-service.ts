import moment = require("moment");
import { User } from "parse";
import { WorkGroup, PermissionTable } from "../models/access-control";
import sharp = require("sharp");
import sizeOf = require('image-size');
import { ICardholderObject, ECardholderStatus } from "../modules/acs/sipass/siPass_define";

export class MemberService {
    async resizeImage (base64Image:string) {
       if(!base64Image)return "";
       try{
            let parts = base64Image.split(';');
            let mimType = parts[0].split(':')[1];
            let imageData = parts[1].split(',')[1];
            
            let img = new Buffer(imageData, 'base64');
            let dimensions = sizeOf(img);
            console.log("originial size", dimensions.width, dimensions.height);
            let baseRatio = 300 / (dimensions.width > dimensions.height ? dimensions.width : dimensions.height) ;
            let newHeight:number = Math.floor(dimensions.height * baseRatio);
            let newWidth:number = Math.floor(dimensions.width * baseRatio);
            console.log("resized", newWidth, newHeight)
            let resizedImageBuffer = await sharp(img).resize(newWidth, newHeight).toBuffer();
            let resizedImageData = resizedImageBuffer.toString('base64');
            return resizedImageData;
       }catch (err){
           console.log("failed to resize image", err);
            return "";
       }
        //let resizedBase64 = `data:${mimType};base64,${resizedImageData}`;
        
    }

async createMember (inputFormData:any, user:User) {
    
        let workGroupSelectItems = await new Parse.Query(WorkGroup).find();
        let dob= testDate(inputFormData.birthday, "T");
          // AccessRules
    let permissionTables = await new Parse.Query(PermissionTable)
                        .containedIn("tableid", inputFormData.permissionTable.map(x=>parseInt(x)))
                        .limit(Number.MAX_SAFE_INTEGER).find();
    
    let accessRules=[];
    for (const rid of inputFormData.permissionTable) {            
        let permission = permissionTables.find(x=>x.get("tableid")== +rid);
        console.log("permission", permission, rid);
        //not in sipass or ccure
        if(!permission)continue;
        
        let newRule = {
            ObjectName: permission.get("tablename"),
            ObjectToken:  permission.get("tableid").toString(),
            RuleToken: permission.get("tableid").toString(),
            RuleType: 4,
            Side: 0,
            TimeScheduleToken: "0"
        };
        accessRules.push(newRule);
    }
          console.log("dob", dob);
          let tempPersonalDetails: any = {
                Address: "",
                ContactDetails: {
                    Email: inputFormData.email || "",
                    MobileNumber: inputFormData.extensionNumber || "",
                    MobileServiceProviderId: "0",
                    PagerNumber: "",
                    PagerServiceProviderId: "0",
                    PhoneNumber: inputFormData.phone || "",
                    },
                    DateOfBirth: dob || "",
                    PayrollNumber: "",
                    Title: "",
                    UserDetails: {
                        Password: inputFormData.password || "",
                        UserName: inputFormData.account || ""
                    }
          };
          let now = new Date();
          let credential = {
                CardNumber: (inputFormData.cardNumber || "").toString(),
                Pin: inputFormData.pin || "0",
                FacilityCode: parseInt(inputFormData.deviceNumber||"469"),
                ProfileId: !isNaN(parseInt(inputFormData.cardCertificate)) ? parseInt(inputFormData.cardCertificate) : 0,
                ProfileName : inputFormData.profileName || "基礎",
                CardTechnologyCode : inputFormData.technologyCode || 10,
                PinMode: inputFormData.pinMode || 1,          
                PinDigit:inputFormData.pinDigit || 0,
                EndDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
                StartDate:moment(inputFormData.startDate || now).format()
              };
              
          let tempCredentials:any[] = credential.CardNumber && credential.CardNumber.trim()!="" ? [credential] : [];
          
          let tempCustomFieldsList: any = [];
          for(let field of CustomFields){
            if(field.name=="lastEditPerson"){
                tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue: user.getUsername()});
            }
            else if(field.name=="lastEditTime"){
                tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue: moment().format()}); 
            }
            else if(field.date) {
                tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue: testDate(inputFormData[field.name])});
            }
            else tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue:inputFormData[field.name] || null});
          }
          let imageBase64 = await this.resizeImage(inputFormData.cardholderPortrait);
          let wg= workGroupSelectItems.find(x=>x.get("groupid")==parseInt(inputFormData.personType || "1"));
          let member:ICardholderObject = {        
              // master
              objectId: inputFormData.objectId,
              AccessRules: accessRules,
              PrimaryWorkgroupId: wg ? wg.get("groupid") : 1,
              ApbWorkgroupId: wg ? wg.get("groupid") : 1,
              PrimaryWorkgroupName: wg? wg.get("groupname"):"正職",
              EmployeeNumber: inputFormData.employeeNumber.toString(),
              LastName: inputFormData.chineseName,
              FirstName: inputFormData.englishName || "-",
              EndDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
              StartDate:moment(inputFormData.startDate || now).format(),
              SmartCardProfileId:"0",
              Status:ECardholderStatus.Valid,
              //new addition
              GeneralInformation:"",
              Attributes:{Void:inputFormData.void || false},
              NonPartitionWorkGroups:[],
              NonPartitionWorkgroupAccessRules:[],
              PrimaryWorkGroupAccessRule:[],
              Token: "-1",
              Vehicle1: {},
              Vehicle2: {},
              VisitorDetails: {
                  VisitorCardStatus: 0,
                  VisitorCustomValues: {}
              },
              TraceDetails: {},
              // special
              Credentials: tempCredentials,
              PersonalDetails: tempPersonalDetails,
              CustomFields: tempCustomFieldsList,
              CardholderPortrait:imageBase64,
              IsImageChanged: inputFormData.isImageChanged
            };
            //console.log("member", JSON.stringify(member));
            return member;
    }
        
}
export default MemberService;
export function testDate(date:string, splitter?:string){
    try{    
        if(!date)return null;
        let dt = moment(date).format();         
        return splitter ? dt.split(splitter)[0] : dt;         
  }catch (err){
      return null;
  }
}

export const memberFields =[
    "system",
    "Attributes",
    "Credentials",
    "AccessRules",
    "EmployeeNumber",
    "EndDate",
    "FirstName",
    "GeneralInformation",
    "LastName",
    "PersonalDetails",
    "PrimaryWorkgroupId",
    "ApbWorkgroupId",
    "PrimaryWorkgroupName",
    "NonPartitionWorkGroups",
    "SmartCardProfileId",
    "StartDate",
    "Status",
    "Token",
    "TraceDetails",
    "Vehicle1",
    "Vehicle2",
    "Potrait",
    "PrimaryWorkGroupAccessRule",
    "NonPartitionWorkgroupAccessRules",
    "VisitorDetails",
    "CustomFields",
    "FingerPrints"];
export const CustomFields = [
    { fieldName:"CustomTextBoxControl1__CF", name:"allCardNumber", date:false},
    { fieldName:"CustomTextBoxControl6__CF", name:"companyName", date:false},
    { fieldName:"CustomTextBoxControl2__CF",name:"cardCustodian", date:false},
    { fieldName:"CustomTextBoxControl3__CF", name:"lastEditPerson", date:false},
    { fieldName:"CustomDateControl4__CF", name:"lastEditTime", date:true},
    { fieldName:"CustomDropdownControl1__CF", name:"cardType", date:false},    
    { fieldName:"CustomTextBoxControl5__CF_CF", name:"MVPN", date:false},
    { fieldName:"CustomDropdownControl2__CF_CF", name:"gender", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF", name:"department", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF", name:"costCenter", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF", name:"area", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF", name:"workArea", date:false},
    { fieldName:"CustomDateControl1__CF_CF_CF", name:"registrationDate", date:true},
    { fieldName:"CustomDateControl1__CF_CF", name:"birthday", date:true},
    { fieldName:"CustomDateControl1__CF", name:"resignationDate", date:true},
    { fieldName:"CustomDropdownControl2__CF", name:"carLicenseCategory", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF", name:"cardLicense", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"carLicense", date:false},
    { fieldName:"CustomTextBoxControl5__CF", name:"carLicense1", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"carLicense2", date:false},
    { fieldName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"carLicense3", date:false},    
    { fieldName:"CustomTextBoxControl7__CF_CF", name:"resignationNote", date:false},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF", name:"resignationRecordCardRecord", date:false},
    { fieldName:"CustomDropdownControl3__CF_CF", name:"reasonForCard1", date:false},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF", name:"historyForCard1", date:false},
    { fieldName:"CustomDateControl3__CF_CF", name:"dateForCard1", date:true},
    { fieldName:"CustomDropdownControl3__CF_CF_CF", name:"reasonForCard2", date:false},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF", name:"historyForCard2", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF", name:"dateForCard2", date:true},
    { fieldName:"CustomDropdownControl3__CF_CF_CF_CF", name:"reasonForCard3", date:false},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF", name:"historyForCard3", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF", name:"dateForCard3", date:true},
    { fieldName:"CustomDropdownControl3__CF_CF_CF_CF_CF", name:"reasonForApplication1", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF", name:"dateForApplication1", date:true},
    { fieldName:"CustomDropdownControl3__CF_CF_CF_CF_CF_CF", name:"reasonForApplication2", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF", name:"dateForApplication2", date:true},
    { fieldName:"CustomDropdownControl3__CF", name:"reasonForApplication3", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF", name:"dateForApplication3", date:true},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF", name:"resignationRecordCarLicense", date:false},    
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"censusRecord1", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"censusDate1", date:true},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"censusRecord2", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"censusDate2", date:true},
    { fieldName:"CustomTextBoxControl7__CF", name:"censusRecord3", date:false},
    { fieldName:"CustomDateControl3__CF", name:"censusDate3", date:true},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF", name:"infoOfViolation1", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF", name:"dateOfViolation1", date:true},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"infoOfViolation2", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"dateOfViolation2", date:true},
    { fieldName:"CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"infoOfViolation3", date:false},
    { fieldName:"CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF", name:"dateOfViolation3", date:true}
];