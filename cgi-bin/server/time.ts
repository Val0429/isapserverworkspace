import { Action } from 'core/cgi-package';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Get Server Time
 */
type Input = null;
type Output = string;

action.get(
    async (): Promise<Output> => {
        let now: Date = new Date(),
            year: string = String(now.getFullYear()),
            month: string = String(now.getMonth()),
            day: string = String(now.getDay()),
            hour: string = String(now.getHours()),
            minute: string = String(now.getMinutes()),
            second: string = String(now.getSeconds());

        month = month.length == 1 ? `0${month}` : month;
        day = day.length == 1 ? `0${day}` : day;
        hour = hour.length == 1 ? `0${hour}` : hour;
        minute = minute.length == 1 ? `0${minute}` : minute;
        second = second.length == 1 ? `0${second}` : second;

        return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    },
);
