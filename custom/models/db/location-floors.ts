import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationBuildings } from './_index';

/**
 * Floor
 */
export interface ILocationFloors {
    /**
     *
     */
    building: LocationBuildings;

    /**
     *
     */
    name: string;

    /**
     *
     */
    floor: number;
}

@registerSubclass()
export class LocationFloors extends ParseObjectNotice<ILocationFloors> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationFloors');
}
