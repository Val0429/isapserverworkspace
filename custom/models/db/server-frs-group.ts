import * as Enum from '../../enums';

/**
 * FRS User Group
 */
export interface IServerFRSUserGroup {
    /**
     *
     */
    type: Enum.EPeopleType;

    /**
     *
     */
    objectId: string;

    /**
     *
     */
    name: string;
}
