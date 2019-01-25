import * as Canvas from 'canvas';
import { Print } from './print';

export namespace Draw {
    /**
     *
     */
    export interface ISize {
        width: number;
        height: number;
    }

    /**
     *
     */
    export interface ILocation extends ISize {
        x: number;
        y: number;
    }

    /**
     *
     */
    export interface IRect extends ILocation {
        color: string;
        lineWidth: number;
        isFill: boolean;
    }

    /**
     *
     * @param buffer
     */
    async function LoadImage(buffer: Buffer): Promise<Canvas.Image> {
        try {
            let size: Canvas.Image = await new Promise<Canvas.Image>((resolve, reject) => {
                let image: Canvas.Image = new Canvas.Image();
                image.onload = () => {
                    resolve(image);
                };
                image.onerror = (e) => {
                    return reject(e);
                };
                image.src = buffer;
            }).catch((e) => {
                throw e;
            });

            return size;
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     * @param buffer
     */
    export async function ImageSize(buffer: Buffer): Promise<ISize> {
        try {
            let image: Canvas.Image = await LoadImage(buffer);

            let size: ISize = {
                width: image.width,
                height: image.height,
            };

            return size;
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     * @param rects
     * @param size
     * @param buffer
     */
    export async function Rectangle(rects: IRect[], size: ISize): Promise<Buffer>;
    export async function Rectangle(rects: IRect[], buffer: Buffer): Promise<Buffer>;
    export async function Rectangle(rects: IRect[], source: ISize | Buffer): Promise<Buffer> {
        try {
            let canvas = Canvas.createCanvas();
            let ctx = canvas.getContext('2d');

            if (source instanceof Buffer) {
                let image: Canvas.Image = await LoadImage(source);

                canvas.width = image.width;
                canvas.height = image.height;

                ctx.drawImage(image, 0, 0);
            } else {
                canvas.width = source.width;
                canvas.height = source.height;
            }

            for (let rect of rects) {
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.width, rect.height);

                if (rect.isFill) {
                    ctx.fillStyle = rect.color;
                    ctx.fill();
                } else {
                    ctx.lineWidth = rect.lineWidth;
                    ctx.strokeStyle = rect.color;
                    ctx.stroke();
                }
            }

            if (source instanceof Buffer) {
                return canvas.toBuffer('image/jpeg', { quality: 1 });
            } else {
                return canvas.toBuffer();
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     * @param buffer
     * @param size
     */
    export async function Resize(buffer: Buffer, size: ISize, quality: number = 1): Promise<Buffer> {
        try {
            let canvas = Canvas.createCanvas();
            let ctx = canvas.getContext('2d');

            let image: Canvas.Image = await LoadImage(buffer);

            canvas.width = size.width;
            canvas.height = size.height;

            ctx.drawImage(image, 0, 0, size.width, size.height);

            return canvas.toBuffer('image/jpeg', { quality: quality });
        } catch (e) {
            throw e;
        }
    }

    export async function CutImage(locations: ILocation[], buffer: Buffer, quality: number = 1): Promise<Buffer[]> {
        try {
            let buffers: Buffer[] = [];
            let canvas = Canvas.createCanvas();
            let ctx = canvas.getContext('2d');

            let image: Canvas.Image = await LoadImage(buffer);

            locations.forEach((value, index, array) => {
                canvas.width = value.width;
                canvas.height = value.height;

                ctx.drawImage(image, value.x, value.y, value.width, value.height, 0, 0, value.width, value.height);

                buffers.push(canvas.toBuffer('image/jpeg', { quality: quality }));
            });

            return buffers;
        } catch (e) {
            throw e;
        }
    }
}
