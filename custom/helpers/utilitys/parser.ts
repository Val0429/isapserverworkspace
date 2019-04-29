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

    /**
     * Convert base64 string to html src
     * @param base64
     */
    export function Base64Str2HtmlSrc(base64: string): string {
        return `data:image/png;base64, ${base64}`;
    }
}
