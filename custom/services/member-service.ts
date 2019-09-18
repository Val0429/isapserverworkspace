import moment = require("moment");
import { WorkGroup, PermissionTable, IMember, ILinearMember, LinearMember, Member, Door, AccessLevel, DoorGroup, AccessLevelDoor, TimeSchedule } from "../models/access-control";
import sharp = require("sharp");
import sizeOf = require('image-size');
import { ICardholderObject, ECardholderStatus, ICustomFields } from "../modules/acs/sipass/siPass_define";

import { ParseObject } from "helpers/cgi-helpers";
import { CCure800SqlAdapter } from "./acs/CCure800SqlAdapter";
import { siPassAdapter } from "./acsAdapter-Manager";

export class MemberService {
    async resizeImage (base64Image:string) {
       if(!base64Image)return "";
       try{
           console.log("image", base64Image.substring(0,50))
            // let parts = base64Image.split(';');
            // let imageData = parts[1].split(',')[1];
            
            let img = new Buffer(base64Image.indexOf(",")>-1 ? base64Image.substr(base64Image.indexOf(",")+1, base64Image.length) : base64Image, 'base64');
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
    normalizeAccessLevel(member:LinearMember){
        setTimeout(async()=>{
            let memberAccessLevels = await new Parse.Query(AccessLevelDoor).equalTo("member",member).limit(Number.MAX_SAFE_INTEGER).find();
            console.log("destroy existing member access level", memberAccessLevels.length);
            await ParseObject.destroyAll(memberAccessLevels);
            let m = await new Parse.Query(LinearMember)
                        .select("permissionTable")
                        .include("permissionTable.accesslevels.door")
                        .include("permissionTable.accesslevels.doorgroup.doors")
                        .equalTo("objectId", member.id)
                        .first();
                  
            let objects=this.normalizePermissionTable(m);
             console.log("saving AccessLevelDoor", objects.length);             
             await ParseObject.saveAll(objects); 
        },1000);
    }
    normalizePermissionTable(m:LinearMember){
        let objects:any[]=[];
                let member = ParseObject.toOutputJSON(m);
                if(!Array.isArray(member.permissionTable))return;
                for(let permission of member.permissionTable){                        
                    for(let access of permission.accesslevels){
                        if(access.type!="door" && access.type!="doorGroup")continue;
                        if(access.doorgroup && Array.isArray(access.doorgroup.doors)){
                            for(let door of access.doorgroup.doors){
                                let newAccessLevel = this.createAccessLevelDoor(door, member, access, permission);
                                objects.push(newAccessLevel);
                            }
                        }
                        if(access.door){
                            let newAccessLevel = this.createAccessLevelDoor(access.door, member, access, permission);
                                objects.push(newAccessLevel);
                        }
                    }                    
                }    
        return objects;
    }
    private createAccessLevelDoor(door: any, member: any, access: any, permission: any) {
        let pDoor = new Door();
        pDoor.id = door.objectId;
        let pMember = new LinearMember();
        pMember.id = member.objectId;
        let pDoorGroup:any;
        if(access.doorgroup){
            pDoorGroup = new DoorGroup();
            pDoorGroup.id = access.doorgroup.objectId;
        }
        let pAccess = new AccessLevel();
        pAccess.id = access.objectId;
        let pTime = new TimeSchedule();
        pTime.id = access.timeschedule.objectId;
        let pTable = new PermissionTable();
        pTable.id = permission.objectId;
        let newAccessLevel = new AccessLevelDoor({
        member: pMember,
            door: pDoor,
            doorgroup: pDoorGroup,
            permissiontable: pTable,
            accesslevel: pAccess,
            timeschedule: pTime
        });
        return newAccessLevel;
    }

async createSipassCardHolder (inputFormData:ILinearMember) {
    
        let workGroupSelectItems = await new Parse.Query(WorkGroup).find();
        let dob= testDate(inputFormData.birthday, "T");
          // AccessRules
    
    let accessRules=[];
    for (let oPermission of inputFormData.permissionTable) {  
        let permissionJson = ParseObject.toOutputJSON(oPermission);
             
        let permission = await new Parse.Query(PermissionTable).get(permissionJson.objectId)
              
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
          console.log("accessRules", accessRules);
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
                FacilityCode: inputFormData.deviceNumber||469,
                ProfileId: !isNaN(parseInt(inputFormData.cardCertificate)) ? parseInt(inputFormData.cardCertificate) : 0,
                ProfileName : inputFormData.profileName || "基礎",
                CardTechnologyCode : inputFormData.technologyCode || 10,
                PinMode: inputFormData.pinMode || 1,          
                PinDigit: inputFormData.pinDigit || 0,
                EndDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
                StartDate:moment(inputFormData.startDate || now).format()
              };
              
          let tempCredentials:any[] = credential.CardNumber && credential.CardNumber.trim()!="" ? [credential] : [];
          
          let tempCustomFieldsList: any = [];
          for(let field of CustomFields){
            if(field.name=="birthday"){
                tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue: inputFormData[field.name] ? moment(inputFormData[field.name]).format("YYYY-MM-DD") : ""});
            }
            else if(field.date) {
                tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue: testDate(inputFormData[field.name])});
            }
            else tempCustomFieldsList.push({FiledName:field.fieldName, FieldValue:inputFormData[field.name] || null});
          }
          let imageBase64 = await this.resizeImage(inputFormData.cardholderPortrait);
          let wg= workGroupSelectItems.find(x=>x.get("groupid")== inputFormData.personType);
          let defaultWg= workGroupSelectItems.find(x=>x.get("groupname")=="正職");
          let member:ICardholderObject = {        
              // master
              objectId: inputFormData.objectId,
              AccessRules: accessRules,
              PrimaryWorkgroupId: wg ? wg.get("groupid") : defaultWg.get("groupid"),
              ApbWorkgroupId: wg ? wg.get("groupid") :  defaultWg.get("groupid"),
              PrimaryWorkgroupName: wg? wg.get("groupname"): defaultWg.get("groupname"),
              EmployeeNumber: inputFormData.employeeNumber.toString(),
              LastName: inputFormData.chineseName || "_",
              FirstName: inputFormData.englishName || "-",
              EndDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
              StartDate:moment(inputFormData.startDate || now).format(),
              SmartCardProfileId:"0",
              Status:inputFormData.status || ECardholderStatus.Valid,
              //new addition
              GeneralInformation:"",
              Attributes:{Void:inputFormData.void || false},
              NonPartitionWorkGroups:[],
              NonPartitionWorkgroupAccessRules:[],
              PrimaryWorkGroupAccessRule:[],
              Token: inputFormData.token || "-1",
              Vehicle1: { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""},
              Vehicle2: { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""},              
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
    async createLinearMember (inputFormData:ILinearMember, user:string) {
        let now = new Date();
        let workGroupSelectItems = await new Parse.Query(WorkGroup).find();
        let dob= testDate(inputFormData.birthday, "T")||"";
        
        let defaultWg= workGroupSelectItems.find(x=>x.get("groupname")=="正職");
          let imageBase64 = await this.resizeImage(inputFormData.cardholderPortrait);
          let wg= workGroupSelectItems.find(x=>x.get("groupid")==inputFormData.personType);
          let member:ILinearMember = {        
                // master
                objectId: inputFormData.objectId,
                personType: wg ? wg.get("groupid") : defaultWg.get("groupid"),
                primaryWorkgroupId: wg ? wg.get("groupid") : defaultWg.get("groupid"),
                primaryWorkgroupName: wg? wg.get("groupname"):defaultWg.get("groupname"),
                employeeNumber: inputFormData.employeeNumber,
                chineseName: inputFormData.chineseName || "_",
                englishName: inputFormData.englishName || "-",
                endDate:moment(inputFormData.endDate || "2100-12-31T23:59:59+08:00").format(),
                startDate:moment(inputFormData.startDate || now).format(),
                status:inputFormData.status || ECardholderStatus.Valid,
                phone:inputFormData.phone || "",
                email:inputFormData.email || "",
                extensionNumber:inputFormData.extensionNumber || "",
                pin:inputFormData.pin||"",
                //new addition
                void:inputFormData.void || false,
                token: inputFormData.token || "-1" ,
                cardholderPortrait:imageBase64,
                isImageChanged: inputFormData.isImageChanged,                
                deviceNumber : inputFormData.deviceNumber||469,
                cardCertificate : (inputFormData.cardCertificate || 0).toString(),
                profileName : inputFormData.profileName || "基礎",
                technologyCode : inputFormData.technologyCode || 10,
                pinMode : inputFormData.pinMode || 1,
                pinDigit : inputFormData.pinDigit || 0,
                permissionTable:inputFormData.permissionTable,
                cardNumber:inputFormData.cardNumber||""
            };
            for(let customField of CustomFields){                
                member[customField.name]=inputFormData[customField.name] || "";
            }
            member.birthday=dob;
            member.lastEditPerson = inputFormData.lastEditPerson || user;
            member.lastEditTime = moment().format();
            //console.log("member", JSON.stringify(member));
            return member;
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
     
        getMemberQuery(filter:any,showDeleted:boolean=false){
            let query = new Parse.Query(LinearMember);
            
            if (filter.objectId) {
                query.equalTo("objectId", filter.objectId);
            }
            if(!showDeleted){
                query.notEqualTo("status", 1)
            }
            if(filter.objectIds && Array.isArray(filter.objectIds)){
                query.containedIn("objectId", filter.objectIds);
            }
            // looking for duplication
            if (filter.eEmployeeNumber) query.equalTo("employeeNumber",  filter.eEmployeeNumber);
            if (filter.eCardNumber) query.equalTo("cardNumber", filter.eCardNumber);
            if (filter.start2) {
                query.greaterThanOrEqualTo("endDate", moment(filter.start2).format("YYYY-MM-DDT00:00:00"));
            }
            if(filter.end2){
                query.lessThanOrEqualTo("endDate", moment(filter.end2).format("YYYY-MM-DDT23:55:59"));
            }
            if (filter.start1) {
                query.greaterThanOrEqualTo("startDate", moment(filter.start1).format("YYYY-MM-DDT00:00:00"));
            }
            if(filter.end1){
                query.lessThanOrEqualTo("startDate", moment(filter.end1).format("YYYY-MM-DDT23:55:59"));
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
    
            if(filter.expired && filter.expired=="true"){
                query.lessThanOrEqualTo("resignationDate", (new Date()).toISOString());
            }
    
            if(filter.PersonType){
                //console.log("personTpye", filter.PersonType);
                query.equalTo("primaryWorkgroupId", +filter.PersonType);
            }
            if(filter.doorname){
                let doorQuery = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname),"i");             
                let alQueryDoor = new Parse.Query(AccessLevel).matchesQuery("doors", doorQuery);
                let permTableQuery = new Parse.Query(PermissionTable).matchesQuery("accesslevels", alQueryDoor );
                query.matchesQuery("permissionTable", permTableQuery);
            }
            if(filter.doorgroupname){
                
                let doorGroupQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname),"i");
                let alQuery = new Parse.Query(AccessLevel).matchesQuery("doorgroup", doorGroupQuery);
                let permTableQuery = new Parse.Query(PermissionTable).matchesQuery("accesslevels", alQuery);
                query.matchesQuery("permissionTable", permTableQuery);
            }
            
            return query;
        }
        async updateMember(data: ILinearMember, user:string, checkDuplicate:boolean) {
            var { objectId } = data;
            var obj = await new Parse.Query(LinearMember).get(objectId);
            if (!obj) throw new Error(`Member <${objectId}> not exists.`);

            let linearMember = await this.createLinearMember(data, user);
            if(checkDuplicate) await this.checkDuplication(linearMember);
            let member = await this.createSipassCardHolder(linearMember);
            member.Status = obj.get("status");
            member.Token, obj.get("token");
            await siPassAdapter.putCardHolder(member);
            /// 2) Modify
            
            let update = new LinearMember(linearMember);
            update.set("status", obj.get("status"));
            update.set("token", obj.get("token"));
            
            let cCure800SqlAdapter = new CCure800SqlAdapter();
            await cCure800SqlAdapter.writeMember(member, member.AccessRules.map(x => x.ObjectName));
            /// 5) to Monogo        
            await update.save(); 
            this.normalizeAccessLevel(update);           
            /// 3) Output
            return update;
        }
        async createMember(data:ILinearMember, user:string, checkDuplicate:boolean){
            let linearMember = await this.createLinearMember(data, user);
            if(checkDuplicate)await this.checkDuplication(linearMember);
            //sipass and ccure requires this format
            let member = await this.createSipassCardHolder(linearMember);
            let holder = await siPassAdapter.postCardHolder(member);
            
            linearMember.token= holder["Token"];
            var obj = new LinearMember(linearMember);
            
            let cCure800SqlAdapter = new CCure800SqlAdapter();
            //todo: we need to refactor this to accept linear membe instead of sipass object
            await cCure800SqlAdapter.writeMember(member, member.AccessRules.map(x=>x.ObjectName));

            await obj.save(null, { useMasterKey: true });
            this.normalizeAccessLevel(obj);
            /// 2) Output
            return obj;
        }
        async checkDuplication(member: ILinearMember) {
            let emp = await new Parse.Query(LinearMember).notEqualTo("status",1).equalTo("employeeNumber", member.employeeNumber).first();
            if (emp && (!member.objectId || member.objectId != ParseObject.toOutputJSON(emp).objectId)){
                throw new Error(`EmployeeNumber is duplicate.`);
            }
            
            let cardno = member.cardNumber;    
            console.log("checkCardNumber", cardno);
            if (cardno) {
                let cnt = await new Parse.Query(LinearMember).notEqualTo("status",1).equalTo("cardNumber", cardno).first();
                if (cnt && (!member.objectId || member.objectId != ParseObject.toOutputJSON(cnt).objectId)) {   
                    throw new Error(`Credentials.CardNumber is duplicate.`);
                }
                
            }
        }
}
export default MemberService;
export function testDate(date:string, splitter?:string){
    try{    
        if(!date || !date.trim())return null;
        date = date.trim();
        // let it throws exception
        let td = new Date(date);
        //error on date will return 'invalidDate'
        let dt = moment(date).format();         
        return splitter ? dt.split(splitter)[0] : dt;         
  }catch (err){
      return null;
  }
}

export const nonCustomFields=[
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

export const memberFields = [...CustomFields.map(cf=>cf.name),...nonCustomFields];