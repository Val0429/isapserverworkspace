import { Action } from 'core/cgi-package';
import { Print, File } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Get Server Version
 */
type Input = null;
type Output = string;

action.get(
    async (data): Promise<Output> => {
        try {
            let logs: string[] = File.ReadFolder('workspace/custom/assets/logs');
            logs = logs.map((value, index, array) => {
                let name: string = value.replace(/^log\-/, '').replace(/\.log$/, '');
                return `<div><a href='../logs/${value}'>${name}</a></div>`;
            });

            return logs.join('');
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
