import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Events, IEvents,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
// interface InputDate {
//     start: Date;
//     end: Date;
// }
interface InputRange {
    start: Date;
    end: Date;
}
type InputR = Restful.InputR<IEvents> & InputRange;
type OutputR = Restful.OutputR<IEvents>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = Events.Query.get();

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);

    /// V2.2) Filter time range
    query.greaterThanOrEqualTo("createdAt", data.inputType.start);
    query.lessThan("createdAt", data.inputType.end);

    /// V3) Output
    return Restful.Pagination(query, data.parameters, Events.Query.filter(), async (data: Events[]): Promise<Events[]> => {
        await Events.Query.tuner()(data);

        function tryFetch(input: ParseObject<any>, key: string): Promise<void> {
            let entity = input.get(key);
            if (!entity) return Promise.resolve();
            return entity.fetch();
        }

        return new Promise<Events[]>(async (resolve) => {
            let promises: Promise<void>[] = [];
            for (let event of data) {
                let entity = event.getValue("entity");
                promises = [...promises, ...["invitation", "company", "visitor", "kiosk"].map( (key) => tryFetch(entity, key)) ];
            }
            await Promise.all(promises.map(p => p.catch(e => e)));
            resolve(data);
        });
    });

    // /// 1) Make Query
    // var query = Events.Query.get();

    // /// 2) With Extra Filters
    // query = Restful.Filter(query, data.inputType);

    // /// V2.1) Filter company or user
    // function containRole(roles: Parse.Role[], role: RoleList): boolean {
    //     for (let r of roles) if (r.getName() === role) return true;
    //     return false;
    // }
    // if (containRole(data.role, RoleList.TenantAdministrator)) {
    //     query.equalTo("data.company.objectId", data.user.get("data").company.id);
    // } else if (containRole(data.role, RoleList.TenantUser)) {
    //     query.equalTo("data.owner.objectId", data.user.id);
    // }

    // /// V2.2) Filter time range
    // query.greaterThanOrEqualTo("createdAt", data.inputType.start);
    // query.lessThan("createdAt", data.inputType.end);

    // /// V3) Output
    // return Restful.Pagination(query, data.parameters, Events.Query.filter(), async (data: Events[]): Promise<Events[]> => {
    //     await Events.Query.tuner()(data);

    //     function tryFetch(input: ParseObject<any>, key: string): Promise<void> {
    //         let entity = input.get(key);
    //         if (!entity) return Promise.resolve();
    //         return entity.fetch();
    //     }

    //     return new Promise<Events[]>(async (resolve) => {
    //         let promises: Promise<void>[] = [];
    //         for (let event of data) {
    //             let entity = event.getValue("entity");
    //             promises = [...promises, ...["invitation", "company", "visitor", "kiosk"].map( (key) => tryFetch(entity, key)) ];
    //         }
    //         await Promise.all(promises);
    //         resolve(data);
    //     });
    // });
});
/// CRUD end ///////////////////////////////////

export default action;
