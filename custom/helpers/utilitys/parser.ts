import { IResponse } from '../../models';

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

    /**
     * Convert e to response message
     * @param e
     * @param resMessage
     */
    export function E2ResMessage(e: any, resMessage: IResponse.IMultiData): IResponse.IMultiData {
        try {
            resMessage.statusCode = e.detail ? e.detail.statusCode : 500;
            resMessage.message = e.message ? e.message : e.args ? e.args.join('; ') : e;

            return resMessage;
        } catch (e) {
            throw e;
        }
    }
}
