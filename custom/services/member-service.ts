import { CustomFields } from "./report-service";
import moment = require("moment");
import { User } from "parse";
import { WorkGroup, PermissionTable } from "../models/access-control";
import sharp = require("sharp");
import sizeOf = require('image-size');

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
            let newHeight = dimensions.height * baseRatio;
            let newWidth = dimensions.width * baseRatio;
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
          
          let credential = {
                CardNumber: (inputFormData.cardNumber || "").toString(),
                Pin: inputFormData.pin || "0",
                FacilityCode: parseInt(inputFormData.deviceNumber||"469"),
                ProfileId: !isNaN(parseInt(inputFormData.cardCertificate)) ? parseInt(inputFormData.cardCertificate) : 0,
                ProfileName : inputFormData.profileName || "基礎",
                CardTechnologyCode : inputFormData.technologyCode || 10,
                PinMode: inputFormData.pinMode || 1,          
                PinDigit:inputFormData.pinDigit || 0,
                EndDate:moment(inputFormData.endDate || "2100-12-31T23:59:59").format(),
                StartDate:moment(inputFormData.startDate || new Date()).format()
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
          let member = {        
              // master
              objectId: inputFormData.objectId,
              AccessRules: accessRules,
              PrimaryWorkgroupId: wg ? wg.get("groupid") : 1,
              ApbWorkgroupId: wg ? wg.get("groupid") : 1,
              PrimaryWorkgroupName: wg? wg.get("groupname"):"正職",
              EmployeeNumber: inputFormData.employeeNumber.toString(),
              LastName: inputFormData.chineseName,
              FirstName: inputFormData.englishName || "-",
              StartDate: inputFormData.startDate || credential.StartDate,
              EndDate: inputFormData.endDate || credential.EndDate,
              SmartCardProfileId:"0",
              Status:2,
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