import * as Moment from 'moment';
import * as Enum from '../../enums';

export namespace DateTime {
    /**
     * Convert date to format string use moment
     * @param date
     * @param format 'dddd', 'ddd', 'DD', 'D', 'hh', 'h', 'HH', 'H', 'mm', 'm', 'MMMM', 'MMM', 'MM', 'M', 'ss', 's', 'A', 'a', 'YYYY', 'YY', 'ZZ', 'Z'
     */
    export function ToString(date: Date, format: string = 'YYYY/MM/DD HH:mm:ss'): string {
        try {
            return Moment(date).format(format);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Convert string to date use moment
     * @param str
     * @param format 'dddd', 'ddd', 'DD', 'D', 'hh', 'h', 'HH', 'H', 'mm', 'm', 'MMMM', 'MMM', 'MM', 'M', 'ss', 's', 'A', 'a', 'YYYY', 'YY', 'ZZ', 'Z'
     */
    export function ToDate(str: string, format: string = 'YYYY/MM/DD HH:mm:ss'): Date {
        try {
            return Moment(str, format).toDate();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Type to Date
     * @param date
     * @param type
     * @param step
     */
    export function Type2Date(date: Date, type: Enum.ESummaryType): Date;
    export function Type2Date(date: Date, type: Enum.ESummaryType, step: number): Date;
    export function Type2Date(date: Date, type: Enum.ESummaryType, step?: number): Date {
        try {
            step = step || 0;

            date = new Date(date);
            switch (type) {
                case Enum.ESummaryType.hour:
                    date.setHours(date.getHours() + step, 0, 0, 0);
                    break;
                case Enum.ESummaryType.day:
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() + step);
                    break;
                case Enum.ESummaryType.month:
                    date.setHours(0, 0, 0, 0);
                    date.setMonth(date.getMonth() + step, 1);
                    break;
                case Enum.ESummaryType.season:
                    let season = Math.ceil((date.getMonth() + 1) / 3);

                    date.setHours(0, 0, 0, 0);
                    date.setMonth((season - 1 + step) * 3, 1);
                    break;
            }

            return date;
        } catch (e) {
            throw e;
        }
    }
}
