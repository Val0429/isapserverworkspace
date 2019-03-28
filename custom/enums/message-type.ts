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
    packagePostingVisitorNew,
    packagePostingResidentNew,
    packagePostingUpdate,
    packagePostingVisitorReceive,
    packagePostingResidentReceive,

    /**
     * 訪客
     */
    visitorNew,
    visitorDelete,
    visitorLeave,

    /**
     * 公設
     */
    publicFacilityDelete,

    /**
     * 公設預約
     */
    publicFacilityReservationNew,
    publicFacilityReservationUpdate,
    publicFacilityReservationDelete,

    /**
     * 物品
     */
    publicArticleDelete,

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
    listenDelete,

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
