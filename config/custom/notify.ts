import * as Enum from '../../custom/enums';

export interface Config {
    bufferTimeSecond: number;
    [key: number]: {
        isEnable: boolean;
        aims: Enum.ResidentCharacter[];
    };
}

let config: Config = {
    bufferTimeSecond: 1000,

    /**
     * 郵件
     */
    [Enum.MessageType.packageReceiveNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packageReceiveUpdate]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packageReceiveReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 退貨
     */
    [Enum.MessageType.packageReturnNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packageReturnUpdate]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packageReturnReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 寄放物品
     */
    [Enum.MessageType.packagePostingNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packagePostingUpdate]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.packagePostingReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 訪客
     */
    [Enum.MessageType.visitorNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.visitorDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 公設
     */
    [Enum.MessageType.publicFacilityDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 公設預約
     */
    [Enum.MessageType.publicFacilityReservationNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.publicFacilityReservationUpdate]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.publicFacilityReservationDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 物品
     */
    [Enum.MessageType.publicArticleDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 物品預約
     */
    [Enum.MessageType.publicArticleReservationNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.publicArticleReservationReply]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.publicArticleReservationDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 公告
     */
    [Enum.MessageType.publicNotifyNew]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.publicNotifyUpdate]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.publicNotifyDelete]: {
        isEnable: true,
        aims: [],
    },

    /**
     * 行事曆
     */
    [Enum.MessageType.publicCalendarNew]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.publicCalendarUpdate]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.publicCalendarDelete]: {
        isEnable: true,
        aims: [],
    },

    /**
     * 投票
     */
    [Enum.MessageType.voteNew]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.voteUpdate]: {
        isEnable: true,
        aims: [],
    },
    [Enum.MessageType.voteDelete]: {
        isEnable: true,
        aims: [],
    },

    /**
     * 聯絡管委會
     */
    [Enum.MessageType.listenReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.listenDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 瓦斯表
     */
    [Enum.MessageType.gasNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.gasUpdate]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },

    /**
     * 管理費
     */
    [Enum.MessageType.manageCostNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
    [Enum.MessageType.manageCostPayment]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
    },
};
export default config;
