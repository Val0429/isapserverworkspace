import * as Fs from 'fs';
import * as Path from 'path';
import { Parser } from './';

export namespace File {
    /**
     * Assets path
     */
    export const assetsPath: string = RealPath('./workspace/custom/assets');

    /**
     * Get real path
     * @param file
     */
    export function RealPath(file: string): string {
        let realpath: string = Path.resolve(file);
        return realpath;
    }

    /**
     * Create folder
     * @param path
     */
    export function CreateFolder(path: string): void {
        try {
            let realpath: string = RealPath(path);
            let realpaths: string[] = realpath.split(/\/|\\/g);

            realpaths.reduce((previousValue, currentValue, currentIndex, array) => {
                let sum: string = `${previousValue}/${currentValue}`;
                if (!Fs.existsSync(sum)) {
                    Fs.mkdirSync(sum);
                }

                return sum;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Write file
     * @param filename
     * @param data
     */
    export function WriteFile(filename: string, data: any): void {
        try {
            let realpath: string = RealPath(filename);

            Fs.writeFileSync(realpath, data);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Write base64 data to file
     * @param filename
     * @param image
     */
    export function WriteBase64File(filename: string, data: string) {
        try {
            let realpath: string = RealPath(filename);

            let regex = /data:.*;base64, */;
            data = data.replace(regex, '');

            let buffer: Buffer = Buffer.from(data, Parser.Encoding.base64);

            WriteFile(realpath, buffer);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Read file
     * @param filename
     */
    export function ReadFile(filename: string): Buffer {
        try {
            let realpath: string = RealPath(filename);
            let buffer: Buffer = Fs.readFileSync(realpath);

            return buffer;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Delete file
     * @param filename
     */
    export function DeleteFile(filename: string): void {
        try {
            let realpath: string = RealPath(filename);

            Fs.unlinkSync(realpath);
        } catch (e) {
            throw e;
        }
    }

    /**
     * File path to url
     * @param filename
     */
    export function Path2Url(filename: string): string {
        let realpath: string = RealPath(filename);
        realpath = realpath
            .replace(assetsPath, '')
            .replace(/\\/g, '/')
            .replace(/^\//, '');

        return realpath;
    }

    /**
     * Get file extension
     * image/jpeg、image/png、application/pdf、audio/mp4、video/mp4、video/x-ms-wmv
     * @param data
     */
    export function GetExtension(data: string): string {
        try {
            if (data.indexOf('image/jpeg') > -1) {
                return 'jpeg';
            } else if (data.indexOf('image/png') > -1) {
                return 'png';
            } else if (data.indexOf('image/gif') > -1) {
                return 'gif';
            } else if (data.indexOf('image/svg+xml') > -1) {
                return 'svg';
            } else if (data.indexOf('application/pdf') > -1) {
                return 'pdf';
            } else if (data.indexOf('audio/mp4') > -1) {
                return 'mp4';
            } else if (data.indexOf('video/mp4') > -1) {
                return 'mp4';
            } else if (data.indexOf('video/x-ms-wmv') > -1) {
                return 'wmv';
            } else {
                return undefined;
            }
        } catch (e) {
            throw e;
        }
    }
}
