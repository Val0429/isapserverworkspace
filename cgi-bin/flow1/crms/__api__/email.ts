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
    public async Send(subject: string, body: string, object: Email.IObject, attachments: Email.Attachment[] = []): Promise<any> {
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
                attachments: attachments as any[],
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

    export interface AttachmentLike {
        /** String, Buffer or a Stream contents for the attachmentent */
        content?: string | Buffer;
        /** path to a file or an URL (data uris are allowed as well) if you want to stream the file instead of including it (better for larger attachments) */
        path?: string;
    }

    export interface Attachment extends AttachmentLike {
        /** filename to be reported as the name of the attached file, use of unicode is allowed. If you do not want to use a filename, set this value as false, otherwise a filename is generated automatically */
        filename?: string | false;
        /** optional content id for using inline images in HTML message source. Using cid sets the default contentDisposition to 'inline' and moves the attachment into a multipart/related mime node, so use it only if you actually want to use this attachment as an embedded image */
        cid?: string;
        /** If set and content is string, then encodes the content to a Buffer using the specified encoding. Example values: base64, hex, binary etc. Useful if you want to use binary attachments in a JSON formatted e-mail object */
        encoding?: string;
        /** optional content type for the attachment, if not set will be derived from the filename property */
        contentType?: string;
        /** optional transfer encoding for the attachment, if not set it will be derived from the contentType property. Example values: quoted-printable, base64. If it is unset then base64 encoding is used for the attachment. If it is set to false then previous default applies (base64 for most, 7bit for text). */
        contentTransferEncoding?: string;
        /** optional content disposition type for the attachment, defaults to ‘attachment’ */
        contentDisposition?: string;
        /** is an object of additional headers */
        headers?: Headers;
        /** an optional value that overrides entire node content in the mime message. If used then all other options set for this node are ignored. */
        raw?: string | Buffer | AttachmentLike;
    }
}
