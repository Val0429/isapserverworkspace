export namespace Utility {
    /**
     * String pad left some char
     * @param str
     * @param char
     * @param length
     */
    export function PadLeft(str: string, char: string, length: number): string {
        while (str.length < length) {
            str = `${char}${str}`;
        }
        return str;
    }

    /**
     * Convert string array to RegExp
     * @param array
     */
    export function Array2RegExp(...array: string[][]): RegExp {
        let strs: string[] = [].concat(...array);

        let regex: string = '';
        for (let str of strs) {
            regex += `${str}|`;
        }
        regex = regex.replace(/\|$/, '');

        return new RegExp(regex, 'g');
    }
}
