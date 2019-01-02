export namespace Parser {
    /**
     * Encoding of Buffer modules
     */
    export enum Encoding {
        'ascii' = 'ascii',
        'utf8' = 'utf8',
        'utf16le' = 'utf16le',
        'ucs2' = 'ucs2',
        'base64' = 'base64',
        'latin1' = 'latin1',
        'binary' = 'binary',
        'hex' = 'hex',
    }

    /**
     * Convert word to byte array in bit
     * @param numAry word data array
     */
    export function Word2ByteArray(numAry: Array<number>): Array<number> {
        let result: Array<number> = [];
        for (let val of numAry) {
            let num1: number = ((<number>val) & 0xff00) >> 8;
            let num2: number = ((<number>val) & 0x00ff) >> 0;
            result.push(num1);
            result.push(num2);
        }

        return result;
    }

    /**
     * Convert word to byte string in bit
     * @param numAry word data array
     */
    export function Word2ByteString(numAry: Array<number>): string {
        let result: string = '';
        for (let val of numAry) {
            let num1: number = ((<number>val) & 0xff00) >> 8;
            let num2: number = ((<number>val) & 0x00ff) >> 0;
            result += num1 + '';
            result += num2 + '';
        }

        return result;
    }

    /**
     * Convert word to hex string in bit
     * @param numAry word data array
     */
    export function Word2HexString(numAry: Array<number>): string {
        let result: string = '';
        for (let val of numAry) {
            let num1: number = ((<number>val) & 0xf000) >> 12;
            let num2: number = ((<number>val) & 0x0f00) >> 8;
            let num3: number = ((<number>val) & 0x00f0) >> 4;
            let num4: number = ((<number>val) & 0x000f) >> 0;

            result += num1 > 10 ? String.fromCharCode(num1 + 55) : num1;
            result += num2 > 10 ? String.fromCharCode(num2 + 55) : num2;
            result += num3 > 10 ? String.fromCharCode(num3 + 55) : num3;
            result += num4 > 10 ? String.fromCharCode(num4 + 55) : num4;
        }

        return result;
    }

    /**
     * Convert word to int 32 bit format
     * @param numAry word data array
     */
    export function Word2Int32(numAry: Array<number>): Array<number> {
        let result: Array<number> = [];
        let counter: number = 0;
        let temp: number = 0;
        for (let val of numAry) {
            if (!!(counter++ & 0x0001) === false) {
                temp |= val;
            } else {
                result.push((temp << 16) | val);
                temp = 0;
            }
        }

        return result;
    }

    /**
     * Convert json object to json string when have type error: "Converting circular structure to JSON"
     * @param data
     */
    export function JsonString(data: any): string {
        let cache: object[] = [];
        let str: string = JSON.stringify(data, function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    try {
                        return JSON.parse(JSON.stringify(value));
                    } catch (error) {
                        return;
                    }
                }

                cache.push(value);
            }
            return value;
        });

        return str;
    }
}
