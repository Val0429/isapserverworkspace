import { Action } from 'core/cgi-package';
import { DateTime, Print } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
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
            return DateTime.ToString(new Date());
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
