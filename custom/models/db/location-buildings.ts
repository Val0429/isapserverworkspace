import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';
import { ILocation } from '../base/_index';

/**
 * Building
 */
export interface ILocationBuildings {
    /**
     * name.
     */
    name: string;

    /**
     *
     */
    location?: ILocation.ICoordinate;
}

@registerSubclass()
export class LocationBuildings extends ParseObjectNotice<ILocationBuildings> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationBuildings');
}
