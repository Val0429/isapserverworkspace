import * as Os from 'os';
import { File, Print } from '.';

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

    /**
     * Interface with ip
     */
    export interface IIp {
        name: string;
        family: string;
        ip: string;
    }

    /**
     * Get ip list
     */
    export function GetIp(): IIp[] {
        let ifaces = Os.networkInterfaces();

        let ips: IIp[] = new Array<IIp>()
            .concat(
                ...Object.keys(ifaces).map((ifname) => {
                    return ifaces[ifname].map((iface) => {
                        if ('IPv4' === iface.family && iface.internal === false) {
                            return {
                                name: ifname,
                                family: iface.family,
                                ip: iface.address,
                            };
                        }
                    });
                }),
            )
            .filter((value, index, array) => {
                return value !== undefined;
            });

        return ips;
    }

    /**
     * Re start server
     */
    export function ReStartServer(): void {
        let path: string = './workspace/config/default/core.ts';
        let file: Buffer = File.ReadFile(path);
        File.WriteFile(path, file);
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

    export interface ISortData {
        key: any;
        data: string;
    }
    interface ISortAnalysis extends ISortData {
        datas: number[];
    }
    /**
     * Natural sort
     * @param sources
     */
    export function NatSort(sources: ISortData[]): ISortData[] {
        let analysis: ISortAnalysis[] = sources.map((value, index, array) => {
            let datas: string[] = value.data.match(/\d+/g) || [];
            return {
                key: value.key,
                data: value.data,
                datas: datas.map(Number),
            };
        });

        analysis = analysis.sort((a, b) => {
            let length: number = Math.max(a.datas.length, b.datas.length);
            for (let i: number = 0; i < length; i++) {
                let v1: number = a.datas[i] || -1;
                let v2: number = b.datas[i] || -1;

                let result: number = v1 - v2;
                if (result !== 0) {
                    return result;
                }
            }

            return 0;
        });

        return analysis.map((vlaue, index, array) => {
            return {
                key: vlaue.key,
                data: vlaue.data,
            };
        });
    }
}
