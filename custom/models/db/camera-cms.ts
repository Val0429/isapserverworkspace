import { ServerCMS } from './_index';

/**
 * CMS相機設定
 */
export interface ICameraCMS {
    /**
     *
     */
    server: ServerCMS;

    /**
     * NVR id
     */
    nvrId: number;

    /**
     * Channel id
     */
    channelId: number;
}
