import { Subject } from "rxjs";
import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

export const screenShots = new Subject<string>();

export default new Action({
    loginRequired: false
})
.get(async (data) => {
    let imageStr = await screenShots.first().toPromise();
    let res = data.response;
    res.contentType('image/jpeg');
    res.write(Buffer.from(imageStr, 'base64'));
    res.end();
});




