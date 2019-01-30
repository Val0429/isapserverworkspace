import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// 瓦斯抄表 ////////////////////////////////////////
export interface IGasRegistrations {
    id: string;

    address: string;
    date: Date;

    degree: number;
}
@registerSubclass() export class GasRegistrations extends ParseObject<IGasRegistrations> {}
////////////////////////////////////////////////////
