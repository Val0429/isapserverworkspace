import * as NodeMailer from 'nodemailer';
import { Regex } from './';

export class Email {
    /**
     * Config
     */
    private _config: Email.IConfig = undefined;
    public get config(): Email.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Email.IConfig) {
        this._config = value;
    }

    /**
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization
     */
    public Initialization(): void {
        this._isInitialization = false;

        if (!this._config) {
            throw 'smtp config is not setting';
        } else {
            if (!this._config.host) {
                throw 'smtp host is undefined or empty';
            }
            if (!this._config.port || !Regex.IsPort(this._config.port.toString())) {
                throw 'smtp port is undefined or empty or format error';
            }
            if (!this._config.email || !Regex.IsEmail(this._config.email)) {
                throw 'smtp email is undefined or empty or format error';
            }
            if (!this._config.password) {
                throw 'smtp password is undefined or empty';
            }
        }

        this._isInitialization = true;
    }

    /**
     * Send email
     * @param subject
     * @param body
     * @param tos
     * @param ccs
     * @param bccs
     */
    public async Send(subject: string, body: string, object: Email.IObject, attachments: any[] = []): Promise<any> {
        try {
            if (!this._isInitialization) {
                throw 'not initialization';
            }

            let transporter = NodeMailer.createTransport({
                host: this._config.host,
                port: this._config.port,
                secure: false,
                auth: {
                    user: this._config.email,
                    pass: this._config.password,
                },
            });

            let to: string = object.tos.join(', ');
            let cc: string = object.ccs ? object.ccs.join(', ') : '';
            let bcc: string = object.bccs ? object.bccs.join(', ') : '';

            let result = await transporter.sendMail({
                from: this._config.email,
                to: to,
                cc: cc,
                bcc: bcc,
                subject: subject,
                html: body,
                attachments: attachments,
            });

            return result;
        } catch (e) {
            throw e;
        }
    }
}

export namespace Email {
    /**
     *
     */
    export interface IConfig {
        host: string;
        port: number;
        email: string;
        password: string;
    }

    /**
     *
     */
    export interface IObject {
        tos: string[];
        ccs?: string[];
        bccs?: string[];
    }
}
