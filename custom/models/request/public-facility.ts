import { IDayRange, IDateRange } from '../db/_index';

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
    start?: Date;
    end?: Date;
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

export interface IAvailableTime {
    date: Date;
    publicFacilityId: string;
}
