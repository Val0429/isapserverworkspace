import { DateTime } from '../utilitys';

export namespace Print {
    const Reset = '\x1b[0m';

    /**
     * Print font color
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
     * Print background color
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
     * Print format
     */
    export interface Format {
        message: any;
        color?: FontColor;
        background?: BackColor;
    }

    /**
     * Print format message
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
     * Print Min's log
     * @param message
     * @param mode
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

    interface ILogOption {
        now?: boolean;
    }

    /**
     * Print log
     * @param message
     * @param error
     * @param mode
     */
    export function Log(message: any, error: Error, mode: 'message' | 'warning' | 'info' | 'error' | 'success', options?: ILogOption): void {
        let datetime = new DateTime();

        let font: FontColor = FontColor.white;
        let back: BackColor = BackColor.white;
        let title: string = 'Message';
        let date: string = datetime.ToString(new Date());

        switch (mode) {
            case 'warning':
                font = FontColor.yellow;
                back = BackColor.yellow;
                title = 'Warning';
                break;
            case 'info':
                font = FontColor.blue;
                back = BackColor.blue;
                title = '   Info';
                break;
            case 'error':
                font = FontColor.red;
                back = BackColor.red;
                title = '  Error';
                break;
            case 'success':
                font = FontColor.green;
                back = BackColor.green;
                title = 'Success';
                break;
        }

        let path: string = JSON.stringify(error.stack);
        let paths = path.match(/at .*?\(.*?\)\\n/g);
        path = paths && paths.length > 0 ? paths[0].substring(paths[0].lastIndexOf('workspace'), paths[0].lastIndexOf(')')) : '';

        // message = message instanceof Errors ? message.args : message;
        message = message instanceof Error ? message.message : message;
        message = typeof message === 'object' ? JSON.stringify(message) : message;

        Message(
            {
                message: '  ',
                background: back,
            },
            {
                message: date,
                color: font,
            },
            {
                message: title,
                color: font,
            },
            {
                message: '--->',
                color: font,
            },
            {
                message: message,
            },
            {
                message: `(${path})`,
            },
        );

        // if (options && options.now) {
        //     Action.WriteLog.WriteLogs([`${date} ${title} ---> ${message} (${path})`]);
        // } else {
        //     Action.WriteLog.action$.next(`${date} ${title} ---> ${message} (${path})`);
        // }
    }
}
