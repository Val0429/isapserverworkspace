import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { CharacterResidentInfo, IDateRange, PackageReceive, PackageReturn, PackagePosting, Visitor, PublicFacilityReservation, PublicNotify, PublicCalendar, Vote, Listen, PublicArticleReservation, Gas, ManageCost } from '.';
import * as Enum from '../enums';

export interface IMessageContent {
    date?: Date;
    content?: string;
    balance?: number;
    cost?: number;
    lendCount?: number;
    article?: string;
    facility?: string;
    dateRange?: IDateRange;
    title?: string;
    visitor?: string;
}

/**
 * 未讀訊息
 */
export interface IMessageResident {
    /**
     * 住戶訊息
     */
    residentInfo: CharacterResidentInfo;

    /**
     * 訊息類型
     */
    type: Enum.MessageType;

    /**
     * 訊息內容
     */
    message: IMessageContent;

    /**
     * 新郵件、收取郵件
     */
    packageReceive: PackageReceive;

    /**
     * 新增退貨、收取退貨
     */
    packageReturn: PackageReturn;

    /**
     * 新增寄放、寄放物品取件
     */
    packagePosting: PackagePosting;

    /**
     * 新增訪客
     */
    visitor: Visitor;

    /**
     * 新增公設預約、刪除預約
     */
    publicFacilityReservation: PublicFacilityReservation;

    /**
     * 物品借用、物品歸還
     */
    publicArticleReservation: PublicArticleReservation;

    /**
     * 新增公告
     */
    publicNotify: PublicNotify;

    /**
     * 新增行事曆、刪除行事曆
     */
    publicCalendar: PublicCalendar;

    /**
     * 新增投票
     */
    vote: Vote;

    /**
     * 管委會回覆
     */
    listen: Listen;

    /**
     * 瓦斯表新增
     */
    gas: Gas;

    /**
     * 新增管理費、繳納管理費
     */
    manageCost: ManageCost;
}

@registerSubclass()
export class MessageResident extends ParseObject<IMessageResident> {}
