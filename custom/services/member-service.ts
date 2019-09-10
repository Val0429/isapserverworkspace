import moment = require("moment");
import { User } from "parse";
import { WorkGroup, PermissionTable, IMember, ILinearMember, LinearMember } from "../models/access-control";
import sharp = require("sharp");
import sizeOf = require('image-size');
import { ICardholderObject, ECardholderStatus, ICustomFields } from "../modules/acs/sipass/siPass_define";
import { keys } from 'ts-transformer-keys';
import { ParseObject } from "helpers/cgi-helpers";

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
                        .containedIn("objectId", inputFormData.permissionTable)
                        .limit(Number.MAX_SAFE_INTEGER).find();
    
    let accessRules=[];
    for (let permission of permissionTables) {            
        console.log("permission", ParseObject.toOutputJSON(permission));
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
                CardTechnologyCode : parseInt(inputFormData.technologyCode || "10"),
                PinMode: parseInt(inputFormData.pinMode || "1"),          
                PinDigit: parseInt(inputFormData.pinDigit || "0"),
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
    async createLinearMember (inputFormData:ILinearMember, user:User) {
        let now = new Date();
        let workGroupSelectItems = await new Parse.Query(WorkGroup).find();
        let dob= testDate(inputFormData.birthday, "T");
        
        
          let imageBase64 = await this.resizeImage(inputFormData.cardholderPortrait);
          let wg= workGroupSelectItems.find(x=>x.get("groupid")==(inputFormData.personType || 1));
          let member:ILinearMember = {        
                // master
                objectId: inputFormData.objectId,
                primaryWorkgroupId: wg ? wg.get("groupid") : 1,
                primaryWorkgroupName: wg? wg.get("groupname"):"正職",
                employeeNumber: inputFormData.employeeNumber.toString(),
                chineseName: inputFormData.chineseName,
                englishName: inputFormData.englishName || "-",
                endDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
                startDate:moment(inputFormData.startDate || now).format(),
                status:ECardholderStatus.Valid,
                //new addition
                void:inputFormData.void || false,
                token: "-1",
                cardholderPortrait:imageBase64,
                isImageChanged: inputFormData.isImageChanged,
                birthday:dob,
                deviceNumber : inputFormData.deviceNumber||469,
                cardCertificate : (inputFormData.cardCertificate || 0).toString(),
                profileName : inputFormData.profileName || "基礎",
                technologyCode : inputFormData.technologyCode || 10,
                pinMode : inputFormData.pinMode || 1,
                pinDigit : inputFormData.pinDigit || 0,        
                lastEditPerson : user.getUsername(),
                lastEditTime : moment().format(),
            };
            //console.log("member", JSON.stringify(member));
            return member;
    }
    normalizeMember(member:ICardholderObject):IMember { 
        let newMember:any = {};
          
        newMember.objectId = member.objectId;      
        newMember.void = member.Attributes && member.Attributes.Void? member.Attributes.Void:false;
        newMember.permissionTable = member.AccessRules && member.AccessRules.length > 0 ? 
                                    member.AccessRules.filter(x=>x.RuleType && x.RuleType == 4)
                                    .map(x=>parseInt(x.RuleToken)) : [];
        
        newMember.personType = member.PrimaryWorkgroupId;
        newMember.employeeNumber = member.EmployeeNumber;      
        newMember.chineseName = member.LastName;
        newMember.englishName = member.FirstName;
        newMember.primaryWorkgroupName=member.PrimaryWorkgroupName;
        newMember.primaryWorkgroupId=member.PrimaryWorkgroupId;
        let credential = member.Credentials && member.Credentials.length>0 ?  member.Credentials[0]: {};
          
        newMember.cardNumber = credential.CardNumber || "";
        newMember.cardAllNumber = credential.CardNumber || "";
        newMember.cardCertificate = (credential.ProfileId || 0).toString();
        newMember.deviceNumber = credential.FacilityCode || "";
        newMember.pinDigit = credential.PinDigit|| "";
        newMember.profileName = credential.ProfileName|| "";
        newMember.technologyCode = credential.CardTechnologyCode|| "";    
        newMember.pinMode = credential.PinMode|| "";
        newMember.pin = credential.Pin || "0";
        newMember.startDate = moment(member.StartDate).format("YYYY-MM-DD");
        newMember.endDate =moment(member.EndDate).format("YYYY-MM-DD");;
        newMember.cardholderPortrait = member.CardholderPortrait? ("data:image/png;base64,"+member.CardholderPortrait) : "";

        // tab2
        if (member.PersonalDetails) {
            if(member.PersonalDetails.UserDetails){
                newMember.account = member.PersonalDetails.UserDetails.UserName;
                newMember.password = member.PersonalDetails.UserDetails.Password;
            }
            if(member.PersonalDetails.ContactDetails){
                newMember.email = member.PersonalDetails.ContactDetails.Email;
                newMember.phone = member.PersonalDetails.ContactDetails.PhoneNumber;
                newMember.extensionNumber = member.PersonalDetails.ContactDetails.MobileNumber;
            }
            if (member.PersonalDetails.DateOfBirth) {          
                newMember.birthday = member.PersonalDetails.DateOfBirth;          
            }
        }else{
            newMember.account = "";
            newMember.password = "";
            newMember.email = "";
            newMember.phone = "";
            newMember.extensionNumber = "";       
            newMember.birthday = "";
        }
        //custom fields      
        for(let field of CustomFields){
            if(field.name=="lastEditTime"){
                newMember[field.name] = moment(newMember[field.name] ).format("YYYY-MM-DD HH:mm:ss");
            }else{
                newMember[field.name] = this.getFieldValue(field.fieldName, member.CustomFields, field.date);
            }
        }
        return newMember;
      }
      normalizeToLinearMember(member:ICardholderObject, permissionTables:PermissionTable[]):ILinearMember { 
        let newMember:any = {};
        let tableids=member.AccessRules && member.AccessRules.length > 0 ?  member.AccessRules.filter(x=>x.RuleType && x.RuleType == 4)
                                .map(x=>parseInt(x.RuleToken)) : [];
        //newMember.objectId = member.objectId;      
        newMember.void = member.Attributes && member.Attributes.Void? member.Attributes.Void:false;
        newMember.permissionTable = permissionTables.filter(x=>tableids.find(y=>y == x.get("tableid")));
        
        newMember.personType = member.PrimaryWorkgroupId;
        newMember.employeeNumber = member.EmployeeNumber;      
        newMember.chineseName = member.LastName;
        newMember.englishName = member.FirstName;
        newMember.primaryWorkgroupName=member.PrimaryWorkgroupName;
        newMember.primaryWorkgroupId=member.PrimaryWorkgroupId;
        let credential = member.Credentials && member.Credentials.length>0 ?  member.Credentials[0]: {};
          
        newMember.cardNumber = (credential.CardNumber || "").toString();
        newMember.cardAllNumber = (credential.CardNumber || "").toString();
        newMember.cardCertificate = (credential.ProfileId || 0).toString();
        newMember.deviceNumber = credential.FacilityCode || 0;
        newMember.pinDigit = credential.PinDigit|| 0;
        newMember.profileName = credential.ProfileName|| "";
        newMember.technologyCode = credential.CardTechnologyCode|| 10;    
        newMember.pinMode = credential.PinMode || 1;
        newMember.pin = (credential.Pin || "0").toString();
        newMember.startDate = member.StartDate;
        newMember.endDate = member.EndDate;
        newMember.cardholderPortrait = member.CardholderPortrait || "";
        newMember.status = member.Status;
        newMember.token = member.Token;
        // tab2
        if (member.PersonalDetails) {
            if(member.PersonalDetails.UserDetails){
                newMember.account = member.PersonalDetails.UserDetails.UserName;
                newMember.password = member.PersonalDetails.UserDetails.Password;
            }
            if(member.PersonalDetails.ContactDetails){
                newMember.email = member.PersonalDetails.ContactDetails.Email;
                newMember.phone = member.PersonalDetails.ContactDetails.PhoneNumber;
                newMember.extensionNumber = member.PersonalDetails.ContactDetails.MobileNumber;
            }
            if (member.PersonalDetails.DateOfBirth) {          
                newMember.birthday = member.PersonalDetails.DateOfBirth;          
            }
        }else{
            newMember.account = "";
            newMember.password = "";
            newMember.email = "";
            newMember.phone = "";
            newMember.extensionNumber = "";       
            newMember.birthday = "";
        }
        //custom fields      
        for(let field of CustomFields){      
            let exists = member.CustomFields.find(x=>x.FiledName == field.fieldName);      
            newMember[field.name] = exists && exists.FieldValue ?exists.FieldValue: "";         
        }
        return newMember;
      }
      getFieldValue(fieldName:string, customFields:ICustomFields[], isDate:boolean){      
        if(!customFields)return "";
        let exists = customFields.find(x=>x.FiledName == fieldName);
        let value = exists ? (exists.FieldValue || "") : "";
        try{        
            return isDate && value ?  moment(value).format("YYYY-MM-DD"): value;
          }catch(err){
            console.error(err);
            return "";
          }    
    }
        getQuery(filter:any){
            let query = new Parse.Query(LinearMember).notEqualTo("status", 1)
            if (filter.objectId) {
                query.equalTo("objectId", filter.objectId);
            }
            if(filter.objectIds && Array.isArray(filter.objectIds)){
                query.containedIn("objectId", filter.objectIds);
            }
            // looking for duplication
            if (filter.eEmployeeNumber) query.equalTo("employeeNumber",  filter.eEmployeeNumber);
            if (filter.eCardNumber) query.equalTo("cardNumber", filter.eCardNumber);
            if (filter.start2) {
                query.greaterThanOrEqualTo("endDate", filter.start2);
            }
            if(filter.end2){
                query.lessThanOrEqualTo("endDate", filter.end2)
            }
            if (filter.start1) {
                query.greaterThanOrEqualTo("startDate", filter.start1);
            }
            if(filter.end1){
                query.lessThanOrEqualTo("startDate", filter.end1);
            }
            if(filter.LastName) query.matches("chineseName", new RegExp(filter.LastName), "i");
            if(filter.FirstName) query.matches("englishName", new RegExp(filter.FirstName), "i");    
            if(filter.EmployeeNumber) query.matches("employeeNumber", new RegExp(filter.EmployeeNumber), "i");  
    
            if(filter.DepartmentName) query.matches("department",new RegExp(filter.DepartmentName), "i");
            if(filter.CostCenterName) query.matches("costCenter",new RegExp(filter.CostCenterName), "i");
            if(filter.WorkAreaName) query.matches("workArea",new RegExp(filter.WorkAreaName), "i");
            if(filter.CardCustodian) query.matches("cardCustodian",new RegExp(filter.CardCustodian), "i");
            if(filter.CardType) query.matches("cardType",new RegExp(filter.CardType), "i");
            if(filter.CompanyName) query.matches("companyName", new RegExp(filter.CompanyName), "i");
            
            if(filter.ResignationDate){
                let resignDate = moment(filter.ResignationDate).format("YYYY-MM-DD");
                query.matches("resignationDate", new RegExp(resignDate), "i");
            } 
            if(filter.CardNumber) query.matches("cardNumber", new RegExp(filter.CardNumber), "i");    
            else if(!filter.ShowEmptyCardNumber) query.exists("cardNumber").notEqualTo("cardNumber", "");
            
            if(filter.CardNumbers) query.containedIn("cardNumber", filter.CardNumbers.split(","));
            
    
            if(filter.PermissionTable){
                query.containedIn("permissionTable", filter.PermissionTable.split(",").map(x=>x.toString()));
            } 
    
            if(filter.expired && filter.expired=="true"){
                query.lessThanOrEqualTo("resignationDate", (new Date()).toISOString());
            }
    
            if(filter.PersonType){
                //console.log("personTpye", filter.PersonType);
                query.equalTo("primaryWorkgroupId", +filter.PersonType);
            }
            return query;
        }
       
}
export default MemberService;
export function testDate(date:string, splitter?:string){
    try{    
        if(!date)return null;
        //we use it because moment doesn't throw error
        new Date(date);
        //error on date will return 'invalidDate'
        let dt = moment(date).format();         
        return splitter ? dt.split(splitter)[0] : dt;         
  }catch (err){
      return null;
  }
}

export const memberFields = [ 
    "objectId",
    "void",
    "permissionTable",
    "personType",
    "employeeNumber",
    "chineseName",
    "englishName",
    "primaryWorkgroupName",
    "primaryWorkgroupId",
    "cardNumber",
    "cardAllNumber",
    "cardCertificate",
    "isImageChanged",
    "deviceNumber",
    "pinDigit",
    "profileName",
    "technologyCode",
    "pinMode",
    "pin",
    "startDate",
    "endDate",
    "account",
    "password",
    "email",
    "phone",
    "extensionNumber",
    "birthday",
    "allCardNumber",
    "companyName",
    "cardCustodian",
    "lastEditPerson",
    "lastEditTime",
    "cardType",    
    "MVPN",
    "gender",
    "department",
    "costCenter",
    "area",
    "workArea",
    "registrationDate",
    "resignationDate",
    "carLicenseCategory",
    "cardLicense",
    "carLicense",
    "carLicense1",
    "carLicense2",
    "carLicense3",    
    "resignationNote",
    "resignationRecordCardRecord",
    "reasonForCard1",
    "historyForCard1",
    "dateForCard1",
    "reasonForCard2",
    "historyForCard2",
    "dateForCard2",
    "reasonForCard3",
    "historyForCard3",
    "dateForCard3",
    "reasonForApplication1",
    "dateForApplication1",
    "reasonForApplication2",
    "dateForApplication2",
    "reasonForApplication3",
    "dateForApplication3",
    "resignationRecordCarLicense",    
    "censusRecord1",
    "censusDate1",
    "censusRecord2",
    "censusDate2",
    "censusRecord3",
    "censusDate3",
    "infoOfViolation1",
    "dateOfViolation1",
    "infoOfViolation2",
    "dateOfViolation2",
    "infoOfViolation3",
    "dateOfViolation3",
    "status",
    "token"
]

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