import { IDayRange, IDateRange } from '../';

export interface IIndexC {
    publicFacilityId: string;
}

export interface IIndexR {
    publicFacilityId: string;
    name: string;
    description: string;
    limit: number;
    openDates: IDayRange[];
    maintenanceDates: IDayRange[];
    facilitySrc: string;
    pointCost: number;
}

export interface IAll {
    publicFacilityId: string;
    name: string;
    pointCost: number;
}

export interface IReservationC {
    reservationId: string;
}

export interface IReservationR {
    reservationId: string;
    publicFacilityname: string;
    publicFacilityLimit: number;
    publicFacilitySrc: string;
    publicFacilityPointCost: number;
    residentAddress: string;
    residentPoint: number;
    count: number;
    reservationDates: IDateRange;
}

export interface IAvailableTime {
    hours: number[];
}
