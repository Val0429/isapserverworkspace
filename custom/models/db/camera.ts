import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase } from './_index';

/**
 * 相機
 */
export interface ICamera extends IBase {
    /**
     * 名稱
     */
    name: string;

    /**
     *
     */
    stationId: number;
}

@registerSubclass()
export class Camera extends ParseObject<ICamera> {}
