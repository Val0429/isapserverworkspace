export namespace Print {
    /**
     *
     */
    const Reset = '\x1b[0m';

    /**
     *
     */
    export enum FontColor {
        black = '\x1b[30m',
        red = '\x1b[31m',
        green = '\x1b[32m',
        yellow = '\x1b[33m',
        blue = '\x1b[34m',
        magenta = '\x1b[35m',
        cyan = '\x1b[36m',
        white = '\x1b[37m',
    }

    /**
     *
     */
    export enum BackColor {
        black = '\x1b[40m',
        red = '\x1b[41m',
        green = '\x1b[42m',
        yellow = '\x1b[43m',
        blue = '\x1b[44m',
        magenta = '\x1b[45m',
        cyan = '\x1b[46m',
        white = '\x1b[47m',
    }

    /**
     *
     */
    export interface Format {
        message: any;
        color?: FontColor;
        background?: BackColor;
    }

    /**
     *
     * @param messages
     */
    export function Message(...messages: Format[]): void {
        let str: string = '';
        for (let message of messages) {
            str += Reset;
            str += message.background === null || message.background === undefined ? '' : message.background;
            str += message.color === null || message.color === undefined ? '' : message.color;
            str += message.message;
            str += Reset;
            str += ' ';
        }

        console.log(str);
    }

    /**
     *
     * @param message
     */
    export function MinLog(message: any, mode?: 'message' | 'warning' | 'info' | 'error' | 'success'): void {
        let font: FontColor = FontColor.white;
        let back: BackColor = BackColor.white;
        switch (mode) {
            case 'warning':
                font = FontColor.yellow;
                back = BackColor.yellow;
                break;
            case 'info':
                font = FontColor.blue;
                back = BackColor.blue;
                break;
            case 'error':
                font = FontColor.red;
                back = BackColor.red;
                break;
            case 'success':
                font = FontColor.green;
                back = BackColor.green;
                break;
        }

        Message(
            {
                message: '  ',
                background: back,
            },
            {
                message: 'Min log',
                color: font,
            },
            {
                message: '----------------------->',
                color: font,
            },
            {
                message: message,
            },
        );
    }

    /**
     *
     * @param data
     */
    export function JsonString(data: any): string {
        try {
            var cache = [];
            let str: string = JSON.stringify(data, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Duplicate reference found
                        try {
                            // If this value does not reference a parent it can be deduped
                            return JSON.parse(JSON.stringify(value));
                        } catch (error) {
                            // discard key if value cannot be deduped
                            return;
                        }
                    }
                    // Store value in our collection
                    cache.push(value);
                }
                return value;
            });
            cache = null;

            return str;
        } catch (e) {
            throw e;
        }
    }
}
