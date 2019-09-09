import { ReportService } from "workspace/custom/services/report-service";
import { Restful, Action } from "core/cgi-package";
import { IMember, PermissionTable } from "core/events.gen";
import * as XLSX from 'xlsx';
import moment = require("moment");
import { Log } from "workspace/custom/services/log";

var action = new Action({
    loginRequired: true,
    apiToken: "door_member_CRUD"
});
/********************************
 * R: read object
 ********************************/
type InputR = Restful.InputR<any>;


action.get<InputR, any>({ inputType: "InputR" }, async (data) => {

           
    const fs = require('fs')

    let path =  __dirname+"/../../custom/files/"+ data.parameters.fileName;

    try {
        console.log("path",path);
        if (fs.existsSync(path)) {
            //file exists
            return {ready:true}
        }
    } catch(err) {
        console.log(err);
        return {ready:false}
    }
});
/********************************
 * C: create object
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
        console.log("results",total);
        doExport(filename, results, fieldSelected,storedPermissionOptions,extraHeader);
    }, 1000);
    
    return {file:filename};
});

 function doExport(filename:string, members:any[],fieldSelected:any[],storedPermissionOptions:any[],extraHeader:any){
    let exportList =[];
    //let stringExportList =[];
        let headers=[];
        
        for(let field of fieldSelected){
          headers.push(field);
        }
        exportList.push(extraHeader);
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
        //   let exist = stringExportList.find(x=>x==JSON.stringify(newMember));
        //   if(!exist) {
        //     stringExportList.push(JSON.stringify(newMember));
            exportList.push(newMember);
        //  }
          
          
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
        
        //delete file after 30 minutes
        setTimeout(()=>{
            const fs = require('fs');
            fs.unlink(exportFile);
            Log.Info("Deleted export member file", exportFile);
        }, 1000*60*30)
}

/// CRUD end ///////////////////////////////////

export default action;