export const LogTitle = "FRS Server";

export interface IFRSManagerConfig {
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IFRSManagerServiceConfig {
    frsManager: IFRSManagerConfig;
    debug?: boolean;
}

export { RequestLoginReason, UserType, RecognizedUser, UnRecognizedUser } from './../../frs-service/libs/core';
