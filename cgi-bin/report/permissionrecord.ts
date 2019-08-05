import {
    Action, Restful, Door, IPermissionTable, PermissionTable, TimeSchedule, AccessLevel, DoorGroup
} from 'core/cgi-package';



var action = new Action({
    loginRequired: false,
    apiToken: "2-7_report_attendance_R"
});


/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPermissionTable>;
type OutputR = Restful.OutputR<IPermissionTable>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(PermissionTable)
        .include("accesslevels.door")
        .include("accesslevels.doorgroup.doors")
        .include("accesslevels.timeschedule")
        .include("accesslevels.reader");

    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
    }
    if(filter.timename){
        let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("timeschedule", tsQuery);    
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorname){
        let doorQuery = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("door", doorQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorgroupname){
        let dgQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("doorgroup", dgQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});


export default action;
