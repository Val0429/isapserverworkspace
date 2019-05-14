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
     * Convert base64 string to html src
     * @param base64
     */
    export function Base64Str2HtmlSrc(base64: string): string {
        return `data:image/png;base64, ${base64}`;
    }
}
