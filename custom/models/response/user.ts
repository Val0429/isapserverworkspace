export interface IBaseIndexR {
    objectId: string;
    account: string;
    roles: string[];
}

export interface IBaseLogin {
    sessionId: string;
    objectId: string;
    roles: string[];
}
