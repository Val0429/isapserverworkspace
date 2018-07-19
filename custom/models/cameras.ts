import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Floors } from './floors';

/// Floors /////////////////////////////////////////
export interface ICameras {
    /**
     * Which floor this camera locates.
     */
    floor: Floors;

    /**
     * Name of this camera.
     */
    name: string;

    /**
     * Sourceid of this camera.
     */
    sourceid: string;

    /**
     * X, Y location of this camera.
     */
    x: number;
    y: number;

    /**
     * Rotate angle of this camera.
     */
    angle: number;
}
@registerSubclass() export class Cameras extends ParseObject<ICameras> {}
////////////////////////////////////////////////////
