import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationFloor, LocationArea, LocationDevice } from './_index';
import * as Enum from '../../enums';

/**
 * 報告累計
 */
export interface IReportPeopleCountingSummary {
    /**
     * 樓層
     */
    floor: LocationFloor;

    /**
     * 區域
     */
    area: LocationArea;

    /**
     * 裝置
     */
    device: LocationDevice;

    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 時間
     */
    date: Date;

    /**
     * in
     */
    in: number;

    /**
     * out
     */
    out: number;

    /**
     * in 總和
     */
    inTotal: string;

    /**
     * out 總和
     */
    outTotal: string;
}

@registerSubclass()
export class ReportPeopleCountingSummary extends ParseObject<IReportPeopleCountingSummary> {}
