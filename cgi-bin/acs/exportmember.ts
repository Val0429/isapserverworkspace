import { ReportService } from "workspace/custom/services/report-service";
import { Restful, Action } from "core/cgi-package";
import { IMember, PermissionTable } from "core/events.gen";
import * as XLSX from 'xlsx';
import moment = require("moment");

var action = new Action({
    loginRequired: true,
    apiToken: "door_member_CRUD"
});

/********************************
 * R: get object
 ********************************/
type InputC = Restful.InputC<any>;


action.post<InputC, any>({ inputType: "InputC" }, async (data) => {

           
    // 2) Filter data
    let filter = data.inputType.filter;
    filter.ShowEmptyCardNumber="true";
    let fieldSelected = data.inputType.fieldSelected;
    let storedPermissionOptions = data.inputType.storedPermissionOptions;
    let extraHeader = data.inputType.extraHeader;
    let filename = `member_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;
    /// 3) Output
    setTimeout(async ()=>{
    let reportService = new ReportService();
    let {results, total} = await reportService.getMemberRecord(filter, Number.MAX_SAFE_INTEGER, 0);
        console.log("results",results.length);
        doExport(filename, results, fieldSelected,storedPermissionOptions,extraHeader);
    }, 1000);
    
    return {file:filename};
});

 function doExport(filename:string, members:any[],fieldSelected:any[],storedPermissionOptions:any[],extraHeader:any){
    let exportList =[];
        let headers=[];
        
        for(let field of fieldSelected){
          headers.push(field);
        }
        exportList.push(extraHeader)
        for (let member of members){
          let newMember:any = {};
          for(let field of  fieldSelected){
              newMember[field]=member[field];
              if(field=="permissionTable"){
                let permissions = [];
                for(let perm of member.permissionTable){
                    let permissiontable = storedPermissionOptions.find(x=> x.value == perm.toString());
                    if(!permissiontable)continue;
                    permissions.push(permissiontable.text);
                }
                newMember.permissionTable = permissions.join(",");
              }
          }
          let exist = exportList.find(x=>JSON.stringify(x)==JSON.stringify(newMember));
          if(!exist) 
          exportList.push(newMember);
          
        }
        //console.log("response", response)
        console.log("result2", exportList.length)
        let workbook = XLSX.utils.book_new();
        let ws = XLSX.utils.aoa_to_sheet([headers]);        
        XLSX.utils.sheet_add_json(ws, exportList,  {skipHeader: true, origin: "A2"});
        XLSX.utils.book_append_sheet(workbook, ws, "Sheet1");    
        /* generate array buffer */
        //let result = XLSX.write(workbook, {type:"base64", bookType:'xlsx'});
        let exportFile = __dirname+"/../../custom/files/"+ filename;
        console.log("exportFile",exportFile)
        XLSX.writeFile(workbook, exportFile);
        // console.log("result", result);
        //return result;
}

/// CRUD end ///////////////////////////////////

export default action;