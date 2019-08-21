import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// Buildings //////////////////////////////////////
export interface IFlow2Buildings {
    /**
     * Building name.
     */
    name: string;

    location?: {
        lat: number;
        lng: number;
    }
}
@registerSubclass() export class Flow2Buildings extends ParseObject<IFlow2Buildings> {}
////////////////////////////////////////////////////
