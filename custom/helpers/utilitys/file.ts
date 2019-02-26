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
     * Write base64 image to file
     * @param filename
     * @param image
     */
    export function WriteBase64Image(filename: string, image: string) {
        try {
            let realpath: string = RealPath(filename);

            let regex = /data:image\/.*;base64, */;
            image = image.replace(regex, '');

            let buffer: Buffer = Buffer.from(image, Parser.Encoding.base64);

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
}
