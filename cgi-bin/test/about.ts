import * as fs from 'fs';
import * as path from 'path';
import {
    RoleList,
    Action} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator, RoleList.TenantAdministrator, RoleList.TenantUser, RoleList.Kiosk]
});



action.get<any>({
    
}, async () => {
    
    let workspace = readFile('../../product_version.txt');
    let server = readFile('../../../product_version.txt');
    let webclient = readFile('../../custom/web/product_version.txt');
    return {server, workspace, webclient};
});
function readFile(filePath:string){
    let bom="\ufeff";
    let result = fs.readFileSync(path.join(__dirname, filePath), "utf8").toString();
    if(result.indexOf(bom)>-1)result=result.substr(bom.length);
    return result;
}
/////////////////////////////////////////////////////

export default action;