import { Action } from 'core/cgi-package';
import * as path from 'path';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Get Server Position
 */
type Input = null;
type Output = string;

action.get(
    async (): Promise<Output> => {
        let server: string = path.dirname(require.main.filename);

        return `${server.replace(/\\/gi, '/')}/`;
    },
);
