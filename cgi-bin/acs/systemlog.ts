import { Action, Restful, SystemLog} from 'core/cgi-package';
import moment = require('moment');



var action = new Action({
    loginRequired: true,
    apiToken: "system_operationlog_R"
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<SystemLog>;
type OutputR = Restful.OutputR<SystemLog>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
        /// 1) Make Query
        var query = new Parse.Query(SystemLog).include("user");

        let filter = data.parameters as any;
        if(filter.name){
            query.matches("title", new RegExp(filter.name), "i");
        }
        if(filter.content){
            query.matches("message", new RegExp(filter.content), "i");
        }
        if(filter.start){
            query.greaterThanOrEqualTo("createdAt", moment(filter.start+" 00:00:00", "YYYY-MM-DD HH:mm:ss").toDate());
        }
        if(filter.end){
            query.lessThanOrEqualTo("createdAt",  moment(filter.end+" 23:59:59", "YYYY-MM-DD HH:mm:ss").toDate());
        }
        /// 2) With Extra Filters
        query = Restful.Filter(query, data.inputType);
        /// 3) Output
return Restful.Pagination(query, data.parameters);
});


export default action;
