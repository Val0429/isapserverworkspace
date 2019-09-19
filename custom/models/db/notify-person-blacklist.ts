import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * 黑名單通知
 */
export interface INotifyPersonBlacklist {
    /**
     * 名稱
     */
    name: string;

    /**
     * 職位
     */
    position?: string;

    /**
     * 電話
     */
    phone?: string;

    /**
     * email
     */
    email: string;

    /**
     * 備註
     */
    remark?: string;
}

@registerSubclass()
export class NotifyPersonBlacklist extends ParseObjectNotice<INotifyPersonBlacklist> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'NotifyPersonBlacklist');
}
