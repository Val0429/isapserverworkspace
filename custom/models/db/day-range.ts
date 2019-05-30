import { IDateRange } from './_index';

/**
 * Day range
 */
export interface IDayRange extends IDateRange {
    /**
     * 起始日
     */
    startDay: string;

    /**
     * 結束日
     */
    endDay: string;
}
