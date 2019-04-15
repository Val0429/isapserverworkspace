export namespace Regex {
    /**
     * Check string is number?
     * @param str
     */
    export function IsNum(str: string): boolean {
        let rule: any = /^[0-9]*$/;

        return rule.test(str);
    }

    /**
     * Check string is ip?
     * @param str
     */
    export function IsIp(str: string): boolean {
        let rule: any = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

        if (str === 'localhost') {
            return true;
        }

        return rule.test(str);
    }

    /**
     * Check string is email?
     * @param str
     */
    export function IsEmail(str: string): boolean {
        let rule: any = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;

        return rule.test(str);
    }

    /**
     * Check string is port?
     * @param str
     */
    export function IsPort(str: string): boolean {
        let rule: any = /^[0-9]*$/;

        return rule.test(str) && parseInt(str) > 0 && parseInt(str) < 65536;
    }
}
