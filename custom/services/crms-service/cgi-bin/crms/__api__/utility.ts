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
     *
     */
    let pools: { num: string[]; EN: string[]; en: string[]; symbol: string[] } = {
        num: [...Array(10).keys()].map((value, index, array) => {
            return String.fromCharCode(48 + value);
        }),
        EN: [...Array(26).keys()].map((value, index, array) => {
            return String.fromCharCode(65 + value);
        }),
        en: [...Array(26).keys()].map((value, index, array) => {
            return String.fromCharCode(97 + value);
        }),
        symbol: ['!', '@', '#', '$', '%', '&', '*', '+', '-', '?'],
    };

    /**
     * Random Text
     * @param len
     * @param option
     */
    export function RandomText(len: number, option?: { num?: boolean; EN?: boolean; en?: boolean; symbol?: boolean }): string {
        try {
            option = {
                ...{
                    num: true,
                    EN: true,
                    en: true,
                    symbol: true,
                },
                ...option,
            };

            let strs: string[] = [];
            if (option.num) strs.push(...pools.num);
            if (option.EN) strs.push(...pools.EN);
            if (option.en) strs.push(...pools.en);
            if (option.symbol) strs.push(...pools.symbol);

            let str: string = [...Array(len).keys()]
                .map((value, index, array) => {
                    return strs[Math.floor(Math.random() * strs.length)];
                })
                .join('');

            return str;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Math round
     * @param x
     * @param position
     */
    export function Round(x: number, position: number): number {
        try {
            let multiple: number = Math.pow(10, position);

            return Math.round(x * multiple) / multiple;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Delay
     * @param time
     */
    export async function Delay(time: number): Promise<void> {
        try {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, time);
            });
        } catch (e) {
            throw e;
        }
    }
}
