import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// 社區公告 Announcements //////////////////////////
export interface IAnnouncements {
    /**
     * Title of announcements.
     */
    title: string;

    /**
     * Content of announcements.
     */
    content?: string;
}
@registerSubclass() export class Announcements extends ParseObject<IAnnouncements> {}
////////////////////////////////////////////////////
