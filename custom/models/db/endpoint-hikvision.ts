import { ClientHikVision } from './_index';
import * as Enum from '../../enums';

/**
 * Hikvision 設定
 */
export interface IEndpointHikVision {
    /**
     *
     */
    model: Enum.EEndpoint.hikvision;

    /**
     *
     */
    client: ClientHikVision;
}
