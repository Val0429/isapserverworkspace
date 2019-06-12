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
            Print.Log('Server restart', new Error(), 'warning', { now: true });

            Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
