interface IGPS {
    longitude?: number;
    latitude?: number;
}

export interface IRegionIndexC extends IGPS {
    parentId?: string;
    type: string;
    name: string;
    customId?: string;
    address?: string;
    tagIds?: string[];
    imageBase64: string;
}

export interface IRegionIndexR {
    parentId?: string;
}

export interface IRegionIndexU extends IGPS {
    objectId: string;
    type?: string;
    name?: string;
    customId?: string;
    address?: string;
    tagIds?: string[];
    imageBase64?: string;
}
