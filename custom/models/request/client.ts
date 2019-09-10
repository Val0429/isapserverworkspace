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

/**
 * HikVision Index
 */
export interface IHikVisionIndexC {
    floorId: string;
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IHikVisionIndexU {
    objectId: string;
    floorId?: string;
    protocol?: 'http' | 'https';
    ip?: string;
    port?: number;
    account?: string;
    password?: string;
}

/**
 * VMS Index
 */
export interface IVMSIndexC {
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IVMSIndexU {
    objectId: string;
    protocol?: 'http' | 'https';
    ip?: string;
    port?: number;
    account?: string;
    password?: string;
}
