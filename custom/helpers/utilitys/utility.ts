import * as Os from 'os';

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
}
