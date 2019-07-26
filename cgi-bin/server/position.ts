import { Action } from 'core/cgi-package';
import { Print } from '../../custom/helpers';
import * as path from 'path';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Get Server Position
 */
type Input = null;
type Output = string;

action.get(
    async (): Promise<Output> => {
        try {
            let server: string = path.dirname(require.main.filename);

            return `${server.replace(/\\/gi, '/')}/`;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
