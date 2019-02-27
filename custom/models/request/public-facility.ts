import { IDayRange, IDateRange } from '../';

export interface IIndexBase {
    name: string;
    description: string;
    limit: number;
    openDates: IDayRange[];
    maintenanceDates: IDayRange[];
    pointCost: number;
}

export interface IIndexC extends IIndexBase {
    facilityImage: string;
}

export interface IIndexU extends IIndexBase {
    publicFacilityId: string;
    facilityImage?: string;
}

export interface IIndexD {
    publicFacilityIds: string | string[];
}

export interface IReservationC {
    publicFacilityId: string;
    residentId: string;
    count: number;
    reservationDates: IDateRange;
}

export interface IReservationR {
    date: Date;
    publicFacilityId?: string;
}

export interface IReservationU {
    reservationId: string;
    count: number;
    reservationDates: IDateRange;
}

export interface IReservationD {
    reservationIds: string | string[];
}
