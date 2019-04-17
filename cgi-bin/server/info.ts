import { Action } from 'core/cgi-package';
import { Print } from '../../custom/helpers';

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
    async (): Promise<Output> => {
        try {
            let description: string = process.env.npm_package_description;
            let version: string = process.env.npm_package_version;

            return `${description}(v${version})`;
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
