import * as Moment from 'moment';

export class DateTime {
    /**
     * Convert date to format string use moment
     * @param date
     * @param format 'dddd', 'ddd', 'DD', 'D', 'hh', 'h', 'HH', 'H', 'mm', 'm', 'MMMM', 'MMM', 'MM', 'M', 'ss', 's', 'A', 'a', 'YYYY', 'YY', 'ZZ', 'Z'
     */
    public ToString(date: Date, format: string = 'YYYY/MM/DD HH:mm:ss'): string {
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
    public ToDate(str: string, format: string = 'YYYY/MM/DD HH:mm:ss'): Date {
        try {
            return Moment(str, format).toDate();
        } catch (e) {
            throw e;
        }
    }
}
