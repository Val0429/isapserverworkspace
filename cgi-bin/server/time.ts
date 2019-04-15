import { Action } from 'core/cgi-package';
import { DateTime, Print } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Get Server Time
 */
type Input = null;
type Output = string;

action.get(
    async (): Promise<Output> => {
        try {
            return DateTime.DateTime2String(new Date(), DateTime.Format.default);
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
