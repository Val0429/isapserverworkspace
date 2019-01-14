import * as Canvas from 'canvas';

export namespace Draw {
    export interface ISize {
        width: number;
        height: number;
    }

    export interface IRect extends ISize {
        x: number;
        y: number;
        color: string;
        lineWidth: number;
        isFill: boolean;
    }

    export async function ImageSize(buffer: Buffer): Promise<ISize> {
        try {
            let size: ISize = await new Promise<ISize>((resolve, reject) => {
                let image: Canvas.Image = new Canvas.Image();
                image.onload = () => {
                    resolve({
                        width: image.width,
                        height: image.height,
                    });
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

    export function Rectangle(size: ISize, rects: IRect[]): Buffer {
        try {
            let canvas = Canvas.createCanvas(size.width, size.height);
            let ctx = canvas.getContext('2d');

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

            return canvas.toBuffer();
        } catch (e) {
            throw e;
        }
    }
}
