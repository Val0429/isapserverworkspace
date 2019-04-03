import { Action } from 'core/cgi-package';

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
        return process.env.npm_package_version;
    },
);
