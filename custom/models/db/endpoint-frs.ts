import { ClientFRS } from './_index';
import * as Enum from '../../enums';

/**
 * FRS 設定
 */
export interface IEndpointFRS {
    /**
     *
     */
    model: Enum.EEndpoint.frs;

    /**
     *
     */
    client: ClientFRS;

    /**
     *
     */
    sourceId: string;
}
