import { execFile } from 'child_process';
import { HumanDetect } from './';
import { File } from '../utilitys';

export class Yolo3 {
    /**
     * Yolo3 app path
     */
    protected _path: string;
    public get path(): string {
        return this._path;
    }
    public set path(value: string) {
        this._path = value;
    }

    /**
     * Yolo3 app filename
     */
    protected _filename: string;
    public get filename(): string {
        return this._filename;
    }
    public set filename(value: string) {
        this._filename = value;
    }

    /**
     * Target score
     */
    protected _score: number = 0.25;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization device
     */
    public Initialization(): void {
        this._isInitialization = false;

        if (this._path === null || this._path === undefined) {
            throw HumanDetect.Message.SettingAppPathError;
        }

        if (this._filename === null || this._filename === undefined || this._filename === '') {
            throw HumanDetect.Message.SettingAppFileError;
        }

        this._isInitialization = true;
    }

    /**
     * Do human detection analysis
     */
    public async Analysis(file: string, isShow: boolean = false): Promise<HumanDetect.ILocation[]> {
        if (!this._isInitialization) {
            throw HumanDetect.Message.NotInitialization;
        }

        if (file === null || file === undefined || file === '') {
            throw HumanDetect.Message.SettingInputFileError;
        }

        file = File.RealPath(file);

        let options: string[] = ['detector', 'test', './data/openimages.data', './cfg/yolov3-openimages.cfg', './weights/yolov3-openimages.weights', '-ext_output', '-i', '0', '-thresh', String(this._score), file];
        if (!isShow) {
            options.push('-dont_show');
        }
        let result: string = await new Promise<string>((resolve, reject) => {
            try {
                execFile(this._filename, options, { cwd: this._path }, (error, stdout) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(stdout);
                });
            } catch (e) {
                return reject(e);
            }
        }).catch((e) => {
            throw e;
        });

        let results: string[] = result.split(/\r\n/g);
        let hds: HumanDetect.ILocation[] = results
            .filter((value, index, array) => {
                return value && value.indexOf('Person') >= 0;
            })
            .map<HumanDetect.ILocation>((value, index, array) => {
                let str: string[] = value.match(/[0-9]+/g);

                return {
                    score: Math.round(parseFloat(str[0])) / 100,
                    x: parseFloat(str[1]),
                    y: parseFloat(str[2]),
                    width: parseFloat(str[3]),
                    height: parseFloat(str[4]),
                };
            });

        return hds;
    }
}
