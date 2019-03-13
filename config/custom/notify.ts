import * as Enum from '../../custom/enums';

export interface Config {
    bufferTimeSecond: number;
    [key: number]: {
        isEnable: boolean;
        aims: Enum.ResidentCharacter[];
        title: string;
        body: string;
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
        title: '新增郵件',
        body: '貴住戶您好：住戶中心收到{{address}}、{{receiver}}的快遞郵件，請前往領取，謝謝。',
    },
    [Enum.MessageType.packageReceiveUpdate]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },
    [Enum.MessageType.packageReceiveReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '收取郵件',
        body: '貴住戶您好：已取走{{address}}、{{receiver}}的快遞郵件，謝謝。',
    },

    /**
     * 退貨
     */
    [Enum.MessageType.packageReturnNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增退貨',
        body: '貴住戶您好：您寄放的物件前台已經確認，謝謝。',
    },
    [Enum.MessageType.packageReturnUpdate]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },
    [Enum.MessageType.packageReturnReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '退貨取件',
        body: '貴住戶您好：快遞人員已收走{{address}}、{{sender}}的快遞郵件，謝謝。',
    },

    /**
     * 寄放物品
     */
    [Enum.MessageType.packagePostingVisitorNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增住戶寄放物品',
        body: '貴住戶您好：您寄放的物件前台已經確認，謝謝。',
    },
    [Enum.MessageType.packagePostingResidentNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增訪客寄放物品',
        body: '貴住戶您好：您有一件{{sender}}的寄放物在前台，請記得領取，謝謝。',
    },
    [Enum.MessageType.packagePostingUpdate]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },
    [Enum.MessageType.packagePostingVisitorReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '寄放物品住戶取件',
        body: '{{address}}貴住戶您好：{{sender}}的寄放物品已被{{receiver}}取走，特此通知謝謝。',
    },
    [Enum.MessageType.packagePostingResidentReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '寄放物品訪客取件',
        body: '{{address}}貴住戶您好：您寄放給{{receiver}}的快遞郵件的物件已被收走，謝謝。',
    },

    /**
     * 訪客
     */
    [Enum.MessageType.visitorNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增訪客',
        body: '貴住戶您好，現有{{visitor}}欲拜訪，目的：{{purpose}}，以上通知，請貴住戶知悉。',
    },
    [Enum.MessageType.visitorDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '刪除訪客',
        body: '貴住戶您好，現有{{visitor}}欲拜訪，目的：{{purpose}}，已取消，以上通知，請貴住戶知悉。',
    },

    /**
     * 公設
     */
    [Enum.MessageType.publicFacilityDelete]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '公設刪除',
        body: '貴住戶您好，公設{{facility}}已被刪除，管委會祝您順心如意。',
    },

    /**
     * 公設預約
     */
    [Enum.MessageType.publicFacilityReservationNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增預約',
        body: '貴住戶您好！您預約的{{facility}}（{{dateRange}}）已為您預約，祝您使用愉快！',
    },
    [Enum.MessageType.publicFacilityReservationUpdate]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },
    [Enum.MessageType.publicFacilityReservationDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '刪除預約',
        body: '貴住戶您好！您預約的{{facility}}（{{dateRange}}）已為您取消預約，並退回已扣繳點數。',
    },

    /**
     * 物品
     */
    [Enum.MessageType.publicArticleDelete]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '物品刪除',
        body: '貴住戶您好，借用{{article}}已被刪除，管委會祝您順心如意。',
    },

    /**
     * 物品預約
     */
    [Enum.MessageType.publicArticleReservationNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增借用',
        body: '貴住戶您好，您已於{{YYYYMMDD}}，借用{{article}}，數量{{lendCount}}，請您於使用完畢後歸還，管委會祝您順心如意。',
    },
    [Enum.MessageType.publicArticleReservationReply]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '歸還借用',
        body: '貴住戶您好，您已於{{YYYYMMDD}}，歸還{{article}}，數量{{cost}}，管委會祝您順心如意。',
    },
    [Enum.MessageType.publicArticleReservationDelete]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },

    /**
     * 公告
     */
    [Enum.MessageType.publicNotifyNew]: {
        isEnable: true,
        aims: [],
        title: '新增公告',
        body: '貴住戶您好！社區新增公告，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },
    [Enum.MessageType.publicNotifyUpdate]: {
        isEnable: false,
        aims: [],
        title: '',
        body: '',
    },
    [Enum.MessageType.publicNotifyDelete]: {
        isEnable: true,
        aims: [],
        title: '刪除公告',
        body: '貴住戶您好！社區取消公告，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },

    /**
     * 行事曆
     */
    [Enum.MessageType.publicCalendarNew]: {
        isEnable: true,
        aims: [],
        title: '新增行事曆',
        body: '貴住戶您好！社區新增行事曆{{dateRange}}，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },
    [Enum.MessageType.publicCalendarUpdate]: {
        isEnable: false,
        aims: [],
        title: '',
        body: '',
    },
    [Enum.MessageType.publicCalendarDelete]: {
        isEnable: true,
        aims: [],
        title: '刪除行事曆',
        body: '貴住戶您好！社區取消行事曆{{dateRange}}，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },

    /**
     * 投票
     */
    [Enum.MessageType.voteNew]: {
        isEnable: false,
        aims: [],
        title: '新增投票',
        body: '貴住戶您好！社區新增投票，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },
    [Enum.MessageType.voteUpdate]: {
        isEnable: false,
        aims: [],
        title: '',
        body: '',
    },
    [Enum.MessageType.voteDelete]: {
        isEnable: false,
        aims: [],
        title: '刪除投票',
        body: '貴住戶您好！社區取消投票，內容為：{{title}}，請貴住戶知悉，謝謝。',
    },

    /**
     * 聯絡管委會
     */
    [Enum.MessageType.listenReceive]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '聯絡管委會回覆',
        body: '貴住戶您好！您聯絡管委會的事項：主旨{{title}}，管委會回覆：{{content}}，謝謝您的反應，管委會祝您平安順心。',
    },
    [Enum.MessageType.listenDelete]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '聯絡管委會刪除',
        body: '貴住戶您好！您聯絡管委會的事項：主旨{{title}}，已刪除，謝謝您的反應，管委會祝您平安順心。',
    },

    /**
     * 瓦斯表
     */
    [Enum.MessageType.gasNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增瓦斯表',
        body: '貴住戶您好，{{YYYYMM}}的瓦斯表填寫已開始，填寫截止日為{{deadline}}，提醒您儘早填寫完成，謝謝。',
    },
    [Enum.MessageType.gasUpdate]: {
        isEnable: false,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '',
        body: '',
    },

    /**
     * 管理費
     */
    [Enum.MessageType.manageCostNew]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '新增管理費',
        body: '貴住戶您好，{{YYYYMM}}的管理費填寫已開始收繳，截止日為{{deadline}}，提醒您儘早繳納，謝謝。',
    },
    [Enum.MessageType.manageCostPayment]: {
        isEnable: true,
        aims: [Enum.ResidentCharacter.resident, Enum.ResidentCharacter.committee, Enum.ResidentCharacter.owner],
        title: '收納管理費',
        body: '貴用戶您好！前台已收繳{{YYYYMM}}管理費共{{cost}}元整，管委會祝您順心如意！',
    },
};
export default config;
