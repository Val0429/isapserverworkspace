import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors, LocationCompanies } from './_index';
import * as Enum from '../../enums';

/**
 * Door
 */
export interface ILocationDoor {
    /**
     * name.
     */
    name: string;

    /**
     *
     */
    floor: LocationFloors;

    /**
     *
     */
    company?: LocationCompanies;

    /**
     *
     */
    range: Enum.EDoorRange;
}

@registerSubclass()
export class LocationDoor extends ParseObjectNotice<ILocationDoor> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationDoor');
}
