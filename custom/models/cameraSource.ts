import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface ICameraSource {
    nvr: number;
    channel: number[];
}

@registerSubclass()
export class CameraSource extends ParseObject<ICameraSource> {}
