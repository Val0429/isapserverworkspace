import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter
} from 'core/cgi-package';
import { APIPermissions, APIRoles } from 'models/customRoles';


interface IInputNormal {
    username: string;
    password: string;
}

interface IInputExtend {
    sessionId: string;
}

export type Input = IInputNormal | IInputExtend;

export interface Output {
    sessionId: string;
    serverTime: Date;
    user: Parse.User;
}

export default new Action<Input, Output>({
    loginRequired: false,
    inputType: "Input",
})
.all( async (data) => {
    let sessionId: string, user: Parse.User;
    let permissions=[];
    if ('username' in data.inputType) {
console.log("12341234")        ;
        /// Try login
        try {
            user = await Parse.User.logIn(data.inputType.username, data.inputType.password);
            /// fetch all roles
            
            await Promise.all(user.get("roles").map( r => r.fetch() ) );
            let apiRoles=user.get("apiRoles");
            if(apiRoles){
                let apiRole = new APIRoles();
                apiRole.id=apiRoles[0].id;
                permissions = await new Parse.Query(APIPermissions)
                    .include("a")
                    .include("of")
                    .equalTo("a", apiRole)
                    .find();
            }
            /// Success
            sessionId = user.getSessionToken();

        } catch(reason) {
            throw Errors.throw(Errors.LoginFailed);
        }

        var ev = new EventLogin({
            owner: user
        });
        Events.save(ev);

    } else {
        if (!data.session) throw Errors.throw(Errors.CustomUnauthorized, ["This session is not valid or is already expired."]);
        user = data.user;
        sessionId = data.session.getSessionToken();
        let apiRoles=user.get("apiRoles");
        if(apiRoles){
            let apiRole = new APIRoles();
            apiRole.id=apiRoles[0].id;
            permissions = await new Parse.Query(APIPermissions)
                .include("a")
                .include("of")
                .equalTo("a", apiRole)
                .find();
        }
    }

    return ParseObject.toOutputJSON({
        sessionId,
        serverTime: new Date(),
        user,
        permissions
    });
});
