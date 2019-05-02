import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase } from './_index';

/**
 * 報告
 */
export interface IReportLPR {
    /**
     * 時間
     */
    date: Date;

    /**
     * 車牌號碼
     */
    plateNo: string;

    /**
     *
     */
    stationId: number;
}

@registerSubclass()
export class ReportLPR extends ParseObject<IReportLPR> {}
