import * as Fs from 'fs';
import * as Path from 'path';

export namespace File {
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
     * Save file
     * @param filename
     * @param data
     */
    export function SaveFile(filename: string, data: any): void {
        try {
            let realpath: string = RealPath(filename);

            Fs.writeFileSync(realpath, data);
        } catch (e) {
            throw e;
        }
    }
}
