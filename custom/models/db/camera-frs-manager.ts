import { ServerFRSManager } from './_index';

/**
 * FRS相機設定
 */
export interface ICameraFRSManager {
    /**
     *
     */
    server: ServerFRSManager;

    /**
     *
     */
    frsId: string;

    /**
     *
     */
    sourceId: string;
}
