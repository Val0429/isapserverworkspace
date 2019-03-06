export enum MessageType {
    /**
     * 郵件
     */
    packageReceiveNew,
    packageReceiveUpdate,
    packageReceiveReceive,

    /**
     * 退貨
     */
    packageReturnNew,
    packageReturnUpdate,
    packageReturnReceive,

    /**
     * 寄放物品
     */
    packagePostingNew,
    packagePostingUpdate,
    packagePostingReceive,

    /**
     * 訪客
     */
    visitorNew,
    visitorDelete,

    /**
     * 公設預約
     */
    publicFacilityReservationNew,
    publicFacilityReservationUpdate,
    publicFacilityReservationDelete,

    /**
     * 物品預約
     */
    publicArticleReservationNew,
    publicArticleReservationReply,
    publicArticleReservationDelete,

    /**
     * 公告
     */
    publicNotifyNew,
    publicNotifyUpdate,
    publicNotifyDelete,

    /**
     * 行事曆
     */
    publicCalendarNew,
    publicCalendarUpdate,
    publicCalendarDelete,

    /**
     * 投票
     */
    voteNew,
    voteUpdate,
    voteDelete,

    /**
     * 聯絡管委會
     */
    listenReceive,

    /**
     * 瓦斯表
     */
    gasNew,
    gasUpdate,

    /**
     * 管理費
     */
    manageCostNew,
    manageCostPayment,
}
