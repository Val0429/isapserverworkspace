import { Action } from 'core/cgi-package';
import { DateTime } from '../../custom/helpers';

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
        return DateTime.DateTime2String(new Date(), DateTime.Format.default);
    },
);
