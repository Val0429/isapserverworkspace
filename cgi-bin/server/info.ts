import { Action } from 'core/cgi-package';
import { Print } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
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
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);