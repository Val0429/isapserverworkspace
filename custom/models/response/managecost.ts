import * as Enum from '../../enums';

export interface IIndexR {
    manageCostId: string;
    residentId: string;
    date: Date;
    address: string;
    isParking: boolean;
    deadline: Date;
    chargerName: string;
    status: Enum.ReceiveStatus;
    parkingCost: number;
    manageCost: number;
    balance: number;
}
