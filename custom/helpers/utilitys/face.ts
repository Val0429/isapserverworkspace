import FaceDetection from 'services/face-detection';
import { File, Parser, Draw } from '..';

export namespace Face {
    export interface IDetectArea {
        coordinate: [number, number, number, number];
        eye_distance: number;
        posid: number;
    }

    export interface IDetect {
        faces: number;
        face_list: IDetectArea[];
    }

    /**
     * Use WenMing's face detection dll
     * @param buffer
     */
    export async function Detect(buffer: Buffer): Promise<Draw.ILocation[]>;
    export async function Detect(path: string): Promise<Draw.ILocation[]>;
    export async function Detect(source: string | Buffer): Promise<Draw.ILocation[]> {
        try {
            let image: string = '';
            if (typeof source === 'string') {
                image = File.ReadFile(source).toString(Parser.Encoding.base64);
            } else {
                image = source.toString(Parser.Encoding.base64);
            }

            let result: IDetect = await FaceDetection.detect(image).catch((e) => {
                throw e;
            });

            let faces: Draw.ILocation[] = [];

            if (result.faces > 0) {
                faces = result.face_list.map((value, index, array) => {
                    return {
                        x: value.coordinate[0],
                        y: value.coordinate[1],
                        width: value.coordinate[2],
                        height: value.coordinate[3],
                    };
                });
            }

            return faces;
        } catch (e) {
            throw e;
        }
    }
}
