import { Utility } from './';

export namespace DateTime {
    const _formats: string[] = ['dddd', 'ddd', 'dd', 'd', 'hh', 'h', 'HH', 'H', 'mm', 'm', 'MMMM', 'MMM', 'MM', 'M', 'ss', 's', 'tt', 'TT', 'yyyy', 'yy', 'zz', 'z'];

    const _days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const _months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const _timeNames: string[] = ['am', 'pm', 'AM', 'PM'];

    export enum Format {
        'default' = 'yyyy/MM/dd HH:mm:ss',
    }

    /**
     * Convert date to format string like C#
     * @param dateTime
     * @param format
     */
    export function DateTime2String(dateTime: Date, format: Format | string = Format.default): string {
        let regex: RegExp = Utility.Array2RegExp(_formats);

        let formats: string[] = format.match(regex) || [];
        let spaces: string[] = format.split(regex);

        let year: number = dateTime.getFullYear();
        let month: number = dateTime.getMonth();
        let day: number = dateTime.getDay();
        let date: number = dateTime.getDate();
        let hour: number = dateTime.getHours();
        let minute: number = dateTime.getMinutes();
        let second: number = dateTime.getSeconds();
        let offset: number = dateTime.getTimezoneOffset() + 30;

        let dateStr: string = '';
        for (let i: number = 0; i < spaces.length; i++) {
            switch (formats[i - 1]) {
                case 'dddd':
                    dateStr += _days[day + 7];
                    break;
                case 'ddd':
                    dateStr += _days[day];
                    break;
                case 'dd':
                    dateStr += Utility.PadLeft(date.toString(), '0', 2);
                    break;
                case 'd':
                    dateStr += date.toString();
                    break;
                case 'hh':
                    dateStr += Utility.PadLeft((hour % 12 || 12).toString(), '0', 2);
                    break;
                case 'h':
                    dateStr += (hour % 12 || 12).toString();
                    break;
                case 'HH':
                    dateStr += Utility.PadLeft(hour.toString(), '0', 2);
                    break;
                case 'H':
                    dateStr += hour.toString();
                    break;
                case 'mm':
                    dateStr += Utility.PadLeft(minute.toString(), '0', 2);
                    break;
                case 'm':
                    dateStr += minute.toString();
                    break;
                case 'MMMM':
                    dateStr += _months[month + 12];
                    break;
                case 'MMM':
                    dateStr += _months[month];
                    break;
                case 'MM':
                    dateStr += Utility.PadLeft((month + 1).toString(), '0', 2);
                    break;
                case 'M':
                    dateStr += (month + 1).toString();
                    break;
                case 'ss':
                    dateStr += Utility.PadLeft(second.toString(), '0', 2);
                    break;
                case 's':
                    dateStr += second.toString();
                    break;
                case 'tt':
                    dateStr += hour < 12 ? _timeNames[0] : _timeNames[1];
                    break;
                case 'TT':
                    dateStr += hour < 12 ? _timeNames[2] : _timeNames[3];
                    break;
                case 'yyyy':
                    dateStr += year.toString();
                    break;
                case 'yy':
                    dateStr += year.toString().slice(2);
                    break;
                case 'zz':
                    dateStr += (offset > 0 ? '-' : '+') + Utility.PadLeft((Math.floor(Math.abs(offset) / 60) * 100 + (Math.abs(offset) % 60)).toString(), '0', 4);
                    break;
                case 'z':
                    dateStr += `${offset > 0 ? '-' : '+'}${Math.abs(offset / 60).toString()}`;
                    break;
            }

            dateStr += spaces[i];
        }

        return dateStr;
    }
}
