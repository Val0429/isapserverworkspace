import { Action } from 'core/cgi-package';
import { Print, Utility } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Get Server Version
 */
type Input = null;
type Output = Date;

action.get(
    async (): Promise<Output> => {
        try {
            Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
