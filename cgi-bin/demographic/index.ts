import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;
