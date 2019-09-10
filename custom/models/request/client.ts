/**
 * FRS Index
 */
export interface IFRSIndexC {
    floorId: string;
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IFRSIndexU {
    objectId: string;
    floorId?: string;
    protocol?: 'http' | 'https';
    ip?: string;
    port?: number;
    account?: string;
    password?: string;
}
