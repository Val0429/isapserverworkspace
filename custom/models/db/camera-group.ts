import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, IConfigHanwha, IAction, LocationSite } from './_index';

/**
 * 相機群組
 */
export interface ICameraGroup extends IBase {
    /**
     * 樓層
     */
    site: LocationSite;

    /**
     * Nvr 設定
     */
    nvrConfig: IConfigHanwha;

    /**
     * 動作
     */
    action: IAction;
}

@registerSubclass()
export class CameraGroup extends ParseObject<ICameraGroup> {}
